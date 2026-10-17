import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureProfile } from '../lib/profile.mjs';
import { isolated, runNode, cli } from './helpers.mjs';

function rpc(env, cwd) {
  const child = spawn(process.execPath, [cli, '--mode', 'rpc', '--no-session', '--no-approve', '--provider', 'openai', '--model', 'gpt-4o', '--thinking', 'off'], {
    env: { ...env, OPENAI_API_KEY: 'fixture-not-a-real-key' }, cwd, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true,
  });
  let buffer = '', stderr = '', id = 0;
  const pending = new Map();
  const output = [];
  const failures = [];
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    while (buffer.includes('\n')) {
      const index = buffer.indexOf('\n');
      const line = buffer.slice(0, index); buffer = buffer.slice(index + 1);
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line); output.push(event);
        if (event.type === 'response' && pending.has(event.id)) { pending.get(event.id).resolve(event); pending.delete(event.id); }
      } catch { failures.push(line); }
    }
  });
  child.stderr.on('data', (chunk) => stderr += chunk);
  child.on('exit', (code) => {
    for (const item of pending.values()) item.reject(new Error(`RPC exited (${code}): ${stderr}\n${failures.join('\n')}`));
    pending.clear();
  });
  return {
    child, output, failures,
    request(type) {
      return new Promise((resolve, reject) => {
        const requestId = String(++id);
        const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`RPC timed out: ${stderr}\n${failures.join('\n')}`)); }, 15000);
        pending.set(requestId, { resolve: (event) => { clearTimeout(timer); resolve(event); }, reject: (error) => { clearTimeout(timer); reject(error); } });
        child.stdin.write(JSON.stringify({ id: requestId, type }) + '\n');
      });
    },
    async stop() {
      if (child.exitCode !== null) return;
      const closed = new Promise((resolve) => child.once('close', resolve));
      child.kill('SIGTERM');
      const force = setTimeout(() => child.kill('SIGKILL'), 3000);
      await closed; clearTimeout(force);
    },
  };
}

test('RPC remains valid JSONL, exposes the configured model and skills, and has no splash output', async () => {
  const test = isolated();
  const client = rpc(test.env, test.work);
  try {
    const state = await client.request('get_state');
    assert.equal(state.success, true, JSON.stringify(state));
    assert.equal(state.data.model.id, 'gpt-4o');
    const commands = await client.request('get_commands');
    assert.equal(commands.success, true, JSON.stringify(commands));
    const names = commands.data.commands.map((command) => command.name);
    for (const name of ['banner', 'piolium-balanced', 'run', 'skill:ctf-web']) assert.ok(names.includes(name), `${name} missing`);
    assert.deepEqual(client.failures, []);
    assert.ok(client.output.every((event) => event && typeof event.type === 'string'));
  } finally { await client.stop(); test.cleanup(); }
});

test('a real agent turn works against a local model fixture with no paid API keys', async () => {
  const test = isolated();
  const requests = [];
  const server = createServer((request, response) => {
    let body = '';
    request.on('data', (chunk) => body += chunk);
    request.on('end', () => {
      requests.push({ path: request.url, payload: JSON.parse(body) });
      response.writeHead(200, { 'Content-Type': 'text/event-stream' });
      const frame = (value) => response.write(`data: ${JSON.stringify(value)}\n\n`);
      frame({ id: 'fixture', object: 'chat.completion.chunk', created: 1, model: 'fixture-model', choices: [{ index: 0, delta: { role: 'assistant', content: '0xfun fixture OK' }, finish_reason: null }] });
      frame({ id: 'fixture', object: 'chat.completion.chunk', created: 1, model: 'fixture-model', choices: [{ index: 0, delta: {}, finish_reason: 'stop' }], usage: { prompt_tokens: 20, completion_tokens: 5, total_tokens: 25 } });
      response.end('data: [DONE]\n\n');
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const { agent } = ensureProfile(test.env);
    writeFileSync(join(agent, 'models.json'), JSON.stringify({ providers: { fixture: {
      baseUrl: `http://127.0.0.1:${server.address().port}/v1`, api: 'openai-completions', apiKey: 'fixture',
      compat: { supportsDeveloperRole: false, supportsReasoningEffort: false },
      models: [{ id: 'fixture-model', reasoning: false, contextWindow: 131072, maxTokens: 1024 }],
    } } }));
    const result = await runNode([cli, '--provider', 'fixture', '--model', 'fixture-model', '--thinking', 'off', '--no-session', '--no-approve', '-p', 'Reply with the fixture greeting.'], { env: test.env, cwd: test.work });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stdout.trim(), '0xfun fixture OK');
    assert.equal(requests.length, 1);
    assert.equal(requests[0].path, '/v1/chat/completions');
    const prompt = JSON.stringify(requests[0].payload.messages);
    assert.ok(prompt.includes('CTF Agent'));
    assert.ok(prompt.includes('You are 0xfun, a CTF-focused terminal coding agent.'));
    assert.ok(!prompt.includes('operating inside pi, a coding agent harness.'));
    assert.ok(prompt.includes('ctf-web'));
    const tools = requests[0].payload.tools.map((tool) => tool.function.name);
    for (const tool of ['read', 'bash', 'edit', 'write', 'subagent', 'web_search']) assert.ok(tools.includes(tool));
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    test.cleanup();
  }
});

test('the subagent tool actually launches a child using the same isolated model/profile', { timeout: 60000 }, async () => {
  const test = isolated();
  let childRequests = 0, spawned = false, discovered = false;
  const replies = [];
  const server = createServer((request, response) => {
    let body = '';
    request.on('data', (chunk) => body += chunk);
    request.on('end', () => {
      const payload = JSON.parse(body);
      const messages = payload.messages;
      let delta, finish = 'stop';
      if (messages.some((message) => message.role === 'user' && JSON.stringify(message.content).includes('CHILD_FIXTURE_OK'))) {
        childRequests++;
        delta = { role: 'assistant', content: 'CHILD_FIXTURE_OK' };
      } else if (messages.some((message) => message.role === 'tool' && JSON.stringify(message.content).includes('CHILD_FIXTURE_OK'))) {
        delta = { role: 'assistant', content: '0xfun child fixture OK' };
      } else if (spawned) {
        replies.push(messages.filter((message) => message.role === 'tool').at(-1));
        delta = { role: 'assistant', content: 'child fixture failed' };
      } else {
        const params = discovered ? {
          agent: 'delegate', task: 'Reply with CHILD_FIXTURE_OK.', model: 'fixture/fixture-model',
          context: 'fresh', async: false, output: false, acceptance: false, agentContract: { version: 1 },
        } : { action: 'list' };
        if (discovered) spawned = true;
        discovered = true;
        delta = { role: 'assistant', tool_calls: [{ index: 0, id: spawned ? 'call-child' : 'call-list', type: 'function', function: { name: 'subagent', arguments: JSON.stringify(params) } }] };
        finish = 'tool_calls';
      }
      response.writeHead(200, { 'Content-Type': 'text/event-stream' });
      const frame = (value) => response.write(`data: ${JSON.stringify(value)}\n\n`);
      frame({ id: 'fixture-child', object: 'chat.completion.chunk', created: 1, model: 'fixture-model', choices: [{ index: 0, delta, finish_reason: null }] });
      frame({ id: 'fixture-child', object: 'chat.completion.chunk', created: 1, model: 'fixture-model', choices: [{ index: 0, delta: {}, finish_reason: finish }], usage: { prompt_tokens: 20, completion_tokens: 5, total_tokens: 25 } });
      response.end('data: [DONE]\n\n');
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const { agent } = ensureProfile(test.env);
    writeFileSync(join(agent, 'models.json'), JSON.stringify({ providers: { fixture: {
      baseUrl: `http://127.0.0.1:${server.address().port}/v1`, api: 'openai-completions', apiKey: 'fixture',
      compat: { supportsDeveloperRole: false, supportsReasoningEffort: false },
      models: [{ id: 'fixture-model', reasoning: false, contextWindow: 131072, maxTokens: 1024 }],
    } } }));
    const result = await runNode([cli, '--provider', 'fixture', '--model', 'fixture-model', '--thinking', 'off', '--no-session', '--no-approve', '-p', 'Exercise the child-agent fixture.'], { env: test.env, cwd: test.work, timeout: 45000 });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(result.stdout.trim(), '0xfun child fixture OK', JSON.stringify(replies).slice(0, 4000) + result.stderr);
    assert.equal(childRequests, 1, 'one real child model request must reach the local fixture');
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    test.cleanup();
  }
});
