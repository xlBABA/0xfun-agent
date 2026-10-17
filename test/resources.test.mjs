import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { ensureProfile } from '../lib/profile.mjs';
import { join } from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import { verifyInventory } from '../scripts/inventory.mjs';
import { isolated, runNode } from './helpers.mjs';

test('bundled reference files and license notices match the published snapshot', () => {
  const { inventory, differences } = verifyInventory();
  assert.deepEqual(differences, []);
  assert.equal(inventory.portableSkills.length, 14);
  for (const skill of inventory.excludedHostSkills) assert.equal(existsSync(join(ROOT, 'profile/skills', skill)), false);
});

test('shared host skills are isolated while explicit private product skills still load', async () => {
  const test = isolated();
  try {
    const { agent } = ensureProfile(test.env);
    const skill = (directory, name) => {
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(directory, 'SKILL.md'), `---\nname: ${name}\ndescription: Test-only skill.\n---\nFixture.\n`);
    };
    skill(join(test.home, '.agents/skills/ctf-web'), 'ctf-web');
    skill(join(test.home, '.agents/skills/private-host-skill'), 'private-host-skill');
    skill(join(agent, 'skills/custom-product-skill'), 'custom-product-skill');
    const result = await runNode([join(ROOT, 'test/fixtures/resource-probe.mjs')], { env: test.env, cwd: test.work });
    assert.equal(result.status, 0, result.stderr);
    const resources = JSON.parse(result.stdout);
    assert.deepEqual(resources.errors, []);
    assert.deepEqual(resources.diagnostics, []);
    assert.equal(resources.skills.length, 36);
    assert.ok(resources.skills.includes('custom-product-skill'));
    assert.ok(!resources.skills.includes('private-host-skill'));
  } finally { test.cleanup(); }
});

test('clean profile loads 35 skills, 7 prompts, all tools, and the branded child runtime', async () => {
  const test = isolated();
  try {
    const result = await runNode([join(ROOT, 'test/fixtures/resource-probe.mjs')], { env: test.env, cwd: test.work });
    assert.equal(result.status, 0, result.stderr + result.stdout);
    const resources = JSON.parse(result.stdout);
    assert.deepEqual(resources.errors, []);
    assert.deepEqual(resources.diagnostics, []);
    assert.equal(resources.name, '0xfun');
    assert.equal(resources.configDir, '.0xfun');
    assert.equal(resources.agentDir, join(test.env.OXFUN_HOME, 'agent'));
    assert.equal(resources.skills.length, 35);
    assert.equal(new Set(resources.skills).size, 35);
    assert.equal(resources.prompts.length, 7);
    for (const tool of ['subagent', 'subagent_wait', 'web_search', 'source_check', 'fetch_content', 'get_search_content']) assert.ok(resources.tools.includes(tool));
    for (const command of ['banner', 'run', 'parallel', 'piolium-balanced', 'websearch']) assert.ok(resources.commands.includes(command));
    assert.deepEqual(resources.contexts, [join(test.env.OXFUN_HOME, 'agent/AGENTS.md')]);
    assert.equal(resources.child.command, process.execPath);
    assert.deepEqual(resources.child.args, [join(ROOT, '.runtime/dist/cli.js'), '--version']);
    assert.equal(resources.childConfigDir, '.0xfun');
    assert.equal(resources.childAgentDir, resources.agentDir);
    const child = await runNode(resources.child.args, {
      cwd: test.work,
      env: { ...test.env, PI_PACKAGE_DIR: join(ROOT, '.runtime'), PI_CODING_AGENT_DIR: resources.agentDir, '0XFUN_CODING_AGENT_DIR': resources.agentDir },
    });
    assert.equal(child.status, 0, child.stderr);
    assert.equal(child.stdout.trim(), '1.1.0');
  } finally { test.cleanup(); }
});
