import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT } from '../lib/paths.mjs';
import { manifest } from '../lib/runtime.mjs';

export function resourceFiles() {
  const result = ['AGENTS.md'];
  const walk = (directory) => {
    for (const entry of readdirSync(join(ROOT, directory), { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (path === 'profile/inventory.json') continue;
      if (entry.isSymbolicLink()) throw new Error(`Distribution resources must not be symlinks: ${path}`);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) result.push(path);
    }
  };
  walk('profile');
  walk('licenses');
  return result.sort();
}

export function snapshot() {
  return Object.fromEntries(resourceFiles().map((path) => [path, createHash('sha256').update(readFileSync(join(ROOT, path))).digest('hex')]));
}

export function verifyInventory() {
  const inventory = JSON.parse(readFileSync(join(ROOT, 'profile/inventory.json'), 'utf8'));
  const actual = snapshot();
  const differences = [...new Set([...Object.keys(actual), ...Object.keys(inventory.files)])]
    .filter((path) => actual[path] !== inventory.files[path]);
  if (inventory.version !== manifest.version) differences.push('inventory release version');
  if (JSON.stringify(inventory.dependencies) !== JSON.stringify(manifest.dependencies)) differences.push('inventory dependency versions');
  return { inventory, differences };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--write')) {
    const inventory = {
      distribution: '0xfun', version: manifest.version, dependencies: manifest.dependencies,
      portableSkills: readdirSync(join(ROOT, 'profile/skills')).sort(),
      origins: {
        ctf: { repository: 'https://github.com/ljagiello/ctf-skills', revision: 'd19f35fd3dd2e126108752aee84c657c888126d3', license: 'MIT' },
        discovery: { repository: 'https://github.com/vercel-labs/skills', installedFolderHash: '76a98a285cb0434f3d39e1a873823556330e398b', license: 'MIT' },
        database: { repository: 'https://github.com/supabase/agent-skills', installedFolderHashes: ['3c6bd437aa85f130d5bb90f90ab448009d4b2232', 'd11b54a2ab36d33940504ca9ec3a57bfd6126f26'], license: 'MIT' },
      },
      excludedHostSkills: ['built-in-browser', 'chrome-browser', 'computer-use', 'deep-research', 'docs', 'docx', 'google-workspace', 'import-memory', 'learn', 'morning', 'pdf', 'pptx', 'skill-creator', 'xlsx'],
      files: snapshot(),
    };
    writeFileSync(join(ROOT, 'profile/inventory.json'), JSON.stringify(inventory, null, 2) + '\n');
    console.log(`Recorded ${Object.keys(inventory.files).length} resource checksums.`);
  } else {
    const { differences } = verifyInventory();
    if (differences.length) throw new Error(`Resource checksum mismatch:\n${differences.join('\n')}`);
    console.log('Bundled resource checksums match.');
  }
}
