import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, profilePaths } from '../lib/paths.mjs';
import { ensureProfile, configureEnvironment } from '../lib/profile.mjs';
import { isolated, runNode, cli } from './helpers.mjs';

const json = (path) => JSON.parse(readFileSync(path, 'utf8'));

test('profile is isolated, includes the original instructions, and never seeds secrets', () => {
  const test = isolated();
  try {
    const paths = ensureProfile(test.env);
    assert.equal(paths.agent, join(test.directory, 'profile/agent'));
    assert.deepEqual(readFileSync(join(paths.agent, 'AGENTS.md')), readFileSync(join(ROOT, 'AGENTS.md')));
    assert.equal(existsSync(join(paths.agent, 'auth.json')), false);
    assert.equal(existsSync(join(paths.agent, 'models-store.json')), false);
    assert.equal(existsSync(join(paths.agent, 'sessions')), false);
    assert.deepEqual(json(join(paths.agent, 'settings.json')).packages, [ROOT]);
    const env = {};
    configureEnvironment(paths, join(ROOT, '.runtime'), env);
    assert.equal(env.PI_CODING_AGENT_DIR, paths.agent);
    assert.equal(env['0XFUN_CODING_AGENT_DIR'], paths.agent);
    assert.equal(env.PI_PACKAGE_DIR, join(ROOT, '.runtime'));
    assert.equal(env.PI_SUBAGENTS_PI_CODING_AGENT_PACKAGE_ROOT, join(ROOT, '.runtime'));
    assert.equal(env.PI_OFFLINE, '1');
    assert.equal(env.PI_TELEMETRY, '0');
  } finally { test.cleanup(); }
});

test('pre-existing partial settings receive missing defaults without losing user choices', () => {
  const test = isolated();
  try {
    const { agent } = profilePaths(test.env);
    mkdirSync(agent, { recursive: true });
    writeFileSync(join(agent, 'settings.json'), JSON.stringify({ defaultModel: 'my-model', theme: 'light' }));
    ensureProfile(test.env);
    const settings = json(join(agent, 'settings.json'));
    assert.equal(settings.defaultModel, 'my-model');
    assert.equal(settings.theme, 'light');
    assert.equal(settings.quietStartup, true);
    assert.deepEqual(settings.skills, ['!**/.agents/skills/**']);
    assert.deepEqual(settings.packages, [ROOT]);
  } finally { test.cleanup(); }
});

test('repeated startup preserves user preferences, instructions, and private authentication', () => {
  const test = isolated();
  try {
    const { agent } = ensureProfile(test.env);
    const path = join(agent, 'settings.json');
    const settings = { ...json(path), theme: 'dark', defaultModel: 'my-model', customUserField: true, packages: [ROOT, 'npm:my-own-package@1.0.0'] };
    writeFileSync(path, JSON.stringify(settings));
    writeFileSync(join(agent, 'AGENTS.md'), '# My custom instructions\n');
    writeFileSync(join(agent, 'auth.json'), 'private-test-marker');
    ensureProfile(test.env);
    assert.deepEqual(json(path), settings);
    assert.equal(readFileSync(join(agent, 'AGENTS.md'), 'utf8'), '# My custom instructions\n');
    assert.equal(readFileSync(join(agent, 'auth.json'), 'utf8'), 'private-test-marker');
  } finally { test.cleanup(); }
});

test('moving the distribution migrates only its managed package path', () => {
  const test = isolated();
  try {
    const { agent } = ensureProfile(test.env);
    const statePath = join(agent, 'distribution.json');
    const old = join(test.directory, 'old-checkout');
    writeFileSync(statePath, JSON.stringify({ ...json(statePath), packageRoot: old }));
    const settingsPath = join(agent, 'settings.json');
    writeFileSync(settingsPath, JSON.stringify({ ...json(settingsPath), packages: [{ source: old, prompts: [] }, 'npm:custom@1.2.3'] }));
    ensureProfile(test.env);
    assert.deepEqual(json(settingsPath).packages, [{ source: ROOT, prompts: [] }, 'npm:custom@1.2.3']);
  } finally { test.cleanup(); }
});

test('invalid user settings are rejected without overwriting them', () => {
  const test = isolated();
  try {
    const { agent } = ensureProfile(test.env);
    const path = join(agent, 'settings.json');
    writeFileSync(path, '{ invalid');
    assert.throws(() => ensureProfile(test.env));
    assert.equal(readFileSync(path, 'utf8'), '{ invalid');
    assert.throws(() => profilePaths({ OXFUN_HOME: 'relative/path' }), /absolute path/);
  } finally { test.cleanup(); }
});

test('standalone help/version are branded and do not access or create a user profile', async () => {
  const test = isolated();
  try {
    const version = await runNode([cli, '--version'], { env: test.env, cwd: test.work });
    assert.equal(version.status, 0);
    assert.equal(version.stdout.trim(), '0xfun v1.1.0');
    const help = await runNode([cli, '--help'], { env: test.env, cwd: test.work });
    assert.equal(help.status, 0);
    assert.match(help.stdout, /0xfun v1\.1\.0/);
    assert.ok(!/\bpi\b/.test(help.stdout));
    assert.equal(existsSync(test.env.OXFUN_HOME), false);
  } finally { test.cleanup(); }
});
