import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import { manifest } from '../lib/runtime.mjs';

const prefix = mkdtempSync(join(tmpdir(), '0xfun-install test-'));
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('Run with npm exec -- node scripts/install-smoke.mjs or through npm run test:install.');
try {
  const install = spawnSync(process.execPath, [npmCli, 'run', 'setup', '--', '--prefix', prefix], { cwd: ROOT, encoding: 'utf8', windowsHide: true });
  assert.equal(install.status, 0, install.stdout + install.stderr);
  const shim = join(prefix, process.platform === 'win32' ? '0xfun.cmd' : 'bin/0xfun');
  const result = process.platform === 'win32'
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `""${shim}" --version"`], { encoding: 'utf8', windowsHide: true })
    : spawnSync(shim, ['--version'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.stdout.trim(), `0xfun v${manifest.version}`);
  console.log('Standalone installed command works without an alias or external agent command.');
} finally {
  rmSync(prefix, { recursive: true, force: true });
}
