import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { ROOT } from './paths.mjs';
import { createRequire } from 'node:module';

export const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

export function engineRoot() {
  try { return dirname(dirname(fileURLToPath(import.meta.resolve('@earendil-works/pi-coding-agent')))); }
  catch { throw new Error('Dependencies are missing. In the 0xfun checkout, run: npm ci --ignore-scripts'); }
}

function acquireBuildLock() {
  const lockfile = createRequire(import.meta.url)('proper-lockfile');
  const deadline = Date.now() + 15000;
  const sleeper = new Int32Array(new SharedArrayBuffer(4));
  for (;;) {
    try { return lockfile.lockSync(ROOT, { lockfilePath: join(ROOT, '.runtime.lock'), realpath: false, stale: 30000 }); }
    catch (error) {
      if (error.code !== 'ELOCKED') throw error;
      if (Date.now() >= deadline) throw new Error('Another 0xfun build is still running. Wait for it to finish, then retry.');
      Atomics.wait(sleeper, 0, 0, 50);
    }
  }
}

export function prepareRuntime() {
  const source = engineRoot();
  const engine = JSON.parse(readFileSync(join(source, 'package.json'), 'utf8'));
  const expected = manifest.dependencies['@earendil-works/pi-coding-agent'];
  if (engine.version !== expected) throw new Error(`Runtime version mismatch: expected ${expected}, found ${engine.version}. Run npm ci --ignore-scripts.`);
  const destination = join(ROOT, '.runtime');
  const digest = createHash('sha256').update(JSON.stringify(manifest))
    .update(readFileSync(join(ROOT, 'README.md'))).update(readFileSync(join(ROOT, 'CHANGELOG.md')));
  for (const path of readdirSync(join(ROOT, 'docs'), { recursive: true }).sort()) {
    const absolute = join(ROOT, 'docs', path);
    if (statSync(absolute).isFile()) digest.update(path.replaceAll('\\', '/')).update(readFileSync(absolute));
  }
  const fingerprint = digest.digest('hex');
  const stamp = join(destination, 'distribution.json');
  const current = () => {
    try {
      const previous = JSON.parse(readFileSync(stamp, 'utf8'));
      return previous.version === manifest.version && previous.engine === expected && previous.layout === 2 && previous.fingerprint === fingerprint && existsSync(join(destination, 'dist/cli.js'));
    } catch { return false; }
  };
  if (current()) return destination;
  const release = acquireBuildLock();
  const staging = join(ROOT, `.runtime-${randomUUID()}`);
  try {
    if (current()) return destination;
    mkdirSync(staging);
    for (const item of ['dist', 'docs', 'examples']) {
      cpSync(join(source, item), join(staging, item), { recursive: true });
    }
    cpSync(join(ROOT, 'docs'), join(staging, 'docs'), { recursive: true });
    // Keep upstream package identity for extension compatibility, but use the
    // supported distribution branding/configuration fields for every process.
    writeFileSync(join(staging, 'package.json'), JSON.stringify({
      ...engine,
      version: manifest.version,
      piConfig: { name: '0xfun', configDir: '.0xfun' },
    }, null, 2) + '\n');
    for (const item of ['README.md', 'CHANGELOG.md']) cpSync(join(ROOT, item), join(staging, item));
    cpSync(join(ROOT, 'licenses/runtime-MIT.txt'), join(staging, 'LICENSE'));
    writeFileSync(join(staging, 'distribution.json'), JSON.stringify({ version: manifest.version, engine: expected, layout: 2, fingerprint }) + '\n');
    rmSync(destination, { recursive: true, force: true });
    renameSync(staging, destination);
    return destination;
  } finally {
    rmSync(staging, { recursive: true, force: true });
    release();
  }
}
