import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../lib/paths.mjs';
import { runNode } from './helpers.mjs';

test('concurrent first builds serialize and documentation changes invalidate the runtime cache', async () => {
  const root = mkdtempSync(join(tmpdir(), '0xfun-build-test-'));
  try {
    for (const file of ['package.json', 'README.md', 'CHANGELOG.md']) cpSync(join(ROOT, file), join(root, file));
    cpSync(join(ROOT, 'lib'), join(root, 'lib'), { recursive: true });
    cpSync(join(ROOT, 'docs'), join(root, 'docs'), { recursive: true });
    mkdirSync(join(root, 'licenses'));
    cpSync(join(ROOT, 'licenses/runtime-MIT.txt'), join(root, 'licenses/runtime-MIT.txt'));
    symlinkSync(join(ROOT, 'node_modules'), join(root, 'node_modules'), 'junction');
    const script = `import {prepareRuntime} from ${JSON.stringify(pathToFileURL(join(root, 'lib/runtime.mjs')).href)}; console.log(prepareRuntime());`;
    const results = await Promise.all([runNode(['--input-type=module', '-e', script]), runNode(['--input-type=module', '-e', script])]);
    for (const result of results) assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(join(root, '.runtime.lock')), false);
    const before = JSON.parse(readFileSync(join(root, '.runtime/distribution.json'), 'utf8')).fingerprint;
    writeFileSync(join(root, 'README.md'), readFileSync(join(root, 'README.md'), 'utf8') + '\nBuild cache fixture.\n');
    const next = await runNode(['--input-type=module', '-e', script]);
    assert.equal(next.status, 0, next.stderr);
    const after = JSON.parse(readFileSync(join(root, '.runtime/distribution.json'), 'utf8')).fingerprint;
    assert.notEqual(after, before);
    assert.ok(readFileSync(join(root, '.runtime/README.md'), 'utf8').includes('Build cache fixture.'));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
