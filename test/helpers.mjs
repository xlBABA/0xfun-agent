import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT } from '../lib/paths.mjs';

export function isolated() {
  const directory = mkdtempSync(join(tmpdir(), '0xfun-test-'));
  const home = join(directory, 'home');
  const work = join(directory, 'work');
  mkdirSync(home); mkdirSync(work);
  const env = { ...process.env };
  for (const name of Object.keys(env)) {
    if (/(API_KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTHORIZATION)/i.test(name) || name.startsWith('PI_') || name.startsWith('0XFUN_') || name.startsWith('OXFUN_')) delete env[name];
  }
  Object.assign(env, { HOME: home, USERPROFILE: home, OXFUN_HOME: join(directory, 'profile'), PI_OFFLINE: '1', PI_TELEMETRY: '0' });
  return { directory, home, work, env, cleanup: () => rmSync(directory, { recursive: true, force: true }) };
}

export function runNode(args, { env, cwd = ROOT, timeout = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', (data) => stdout += data);
    child.stderr.on('data', (data) => stderr += data);
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`Test process timed out: ${args.join(' ')}\n${stdout}\n${stderr}`)); }, timeout);
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.on('close', (status) => { clearTimeout(timer); resolve({ status, stdout, stderr }); });
  });
}

export const cli = join(ROOT, 'bin/0xfun.mjs');
