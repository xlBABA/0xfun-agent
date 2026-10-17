#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { ROOT, profilePaths } from '../lib/paths.mjs';
import { manifest, prepareRuntime } from '../lib/runtime.mjs';
import { configureEnvironment, ensureProfile } from '../lib/profile.mjs';

const args = process.argv.slice(2);
const command = args[0];
const help = `0xfun v${manifest.version} — CTF terminal agent

Usage:
  0xfun [options] [message]
  0xfun -p "your task"              Print one answer and exit
  0xfun --continue                 Continue the last session
  0xfun --provider NAME --model ID  Select a provider/model
  0xfun --thinking LEVEL           Set reasoning effort
  0xfun --mode rpc                 JSONL integration mode
  0xfun --list-models              List available models
  0xfun doctor [--json]            Check installation (no model calls)
  0xfun paths                      Show your configuration locations
  0xfun update --models            Refresh provider model catalogs
  0xfun --help --all               Show all runtime options
  0xfun --version                  Show the 0xfun version

In chat:
  /login    Connect your own model account/API credentials
  /model    Switch models
  /banner   Replay the skull animation
  /new      Start a new conversation
  /resume   Open a saved conversation
  /settings Customize preferences
  /hotkeys  List keyboard shortcuts
  /quit     Exit

Configuration: ~/.0xfun/agent/ (override with OXFUN_HOME)
Install guide: README.md in your 0xfun checkout.
Use only on CTFs, labs, and targets you are authorized to assess.
`;

function skillCount(directory) {
  if (!existsSync(directory)) return 0;
  let count = existsSync(join(directory, 'SKILL.md')) ? 1 : 0;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== 'node_modules') count += skillCount(join(directory, entry.name));
  }
  return count;
}

function doctor() {
  const paths = profilePaths();
  const dependencies = Object.fromEntries(Object.entries(manifest.dependencies).map(([name, expected]) => {
    const path = join(ROOT, 'node_modules', name, 'package.json');
    const installed = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')).version : null;
    return [name, { expected, installed, ok: installed === expected }];
  }));
  const bash = process.platform === 'win32'
    ? ['C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files (x86)\\Git\\bin\\bash.exe', 'bash'].find((candidate) => spawnSync(candidate, ['--version'], { stdio: 'ignore', windowsHide: true }).status === 0)
    : spawnSync('bash', ['--version'], { stdio: 'ignore' }).status === 0 ? 'bash' : null;
  const result = {
    name: '0xfun', version: manifest.version, node: process.version, platform: process.platform,
    dependencies, bash: bash ?? null,
    skills: skillCount(join(ROOT, 'profile/skills')) + skillCount(join(ROOT, 'node_modules/pi-subagents/skills')) + skillCount(join(ROOT, 'node_modules/@vigolium/piolium/skills')),
    config: paths.agent,
    ok: Object.values(dependencies).every((item) => item.ok) && Boolean(bash),
  };
  console.log(args.includes('--json') ? JSON.stringify(result, null, 2) : `0xfun v${result.version}\nNode: ${result.node} · ${result.platform}\nDependencies: ${Object.values(dependencies).every((d) => d.ok) ? 'pinned versions OK' : 'MISSING/MISMATCHED — run npm ci --ignore-scripts'}\nBash: ${result.bash ?? 'MISSING — install Bash / Git for Windows'}\nBundled skills: ${result.skills}\nConfiguration: ${result.config}`);
  if (!result.ok) process.exitCode = 1;
}

try {
  if (args.length === 1 && ['--version', '-v'].includes(command)) {
    console.log(`0xfun v${manifest.version}`);
  } else if (['--help', '-h', 'help'].includes(command) && !args.includes('--all')) {
    console.log(help);
  } else if (command === 'doctor') {
    doctor();
  } else if (command === 'paths') {
    const paths = profilePaths();
    console.log(`0xfun: ${ROOT}\nConfiguration: ${paths.agent}\nSessions: ${join(paths.agent, 'sessions')}\nCredentials: ${join(paths.agent, 'auth.json')}`);
  } else if (command === 'update' && !args.includes('--models')) {
    console.log('0xfun dependencies are pinned. Update your checkout with:\n\n  git pull --ff-only\n  npm ci --ignore-scripts\n  npm run setup\n\nFor an exact release, check out its tag/commit before npm ci.\nUse 0xfun update --models to refresh only model catalogs.');
  } else {
    const runtime = prepareRuntime();
    const paths = ensureProfile();
    configureEnvironment(paths, runtime);
    // Catalog refresh is an explicit operation, not a quiet-startup check.
    if (command === 'update' && args.includes('--models')) delete process.env.PI_OFFLINE;
    const forwarded = command === '--help' || command === '-h' ? args.filter((arg) => arg !== '--all') : args;
    const cli = join(runtime, 'dist/cli.js');
    // Child-agent discovery must resolve this same branded, pinned runtime.
    process.argv = [process.execPath, cli, ...forwarded];
    await import(pathToFileURL(cli).href);
  }
} catch (error) {
  console.error(`0xfun: ${error.message}`);
  process.exitCode = 1;
}
