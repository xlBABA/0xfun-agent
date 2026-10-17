import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, sep } from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import { manifest } from '../lib/runtime.mjs';
import { verifyInventory } from './inventory.mjs';

const errors = [];
const { inventory, differences } = verifyInventory();
if (differences.length) errors.push(`Resource checksums changed: ${differences.join(', ')}`);
const shrinkwrapPath = join(ROOT, 'npm-shrinkwrap.json');
if (!existsSync(shrinkwrapPath)) errors.push('npm-shrinkwrap.json is missing.');
else {
  const lock = JSON.parse(readFileSync(shrinkwrapPath, 'utf8'));
  if (lock.version !== manifest.version) errors.push('Shrinkwrap release version does not match package.json.');
  for (const [name, version] of Object.entries(manifest.dependencies)) {
    if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version)) errors.push(`Dependency is not exactly pinned: ${name}`);
    if (lock.packages?.[`node_modules/${name}`]?.version !== version) errors.push(`Shrinkwrap version mismatch: ${name}`);
  }
}
const settings = JSON.parse(readFileSync(join(ROOT, 'profile/settings.json'), 'utf8'));
if (settings.lastChangelogVersion !== manifest.version) errors.push('Profile release version does not match package.json.');
if (settings.defaultProjectTrust !== 'ask' || settings.enableInstallTelemetry !== false) errors.push('Safe profile defaults changed.');
if (!manifest.bin?.['0xfun']) errors.push('The standalone 0xfun command is missing.');
for (const skill of inventory.excludedHostSkills) {
  if (existsSync(join(ROOT, 'profile/skills', skill))) errors.push(`Restricted/host-bound skill unexpectedly included: ${skill}`);
}

const excluded = new Set(['node_modules', '.runtime', '.git', 'coverage', 'artifacts']);
const forbiddenFiles = new Set(['auth.json', 'models-store.json', 'web-search.json', 'trust.json', '.env', '.DS_Store']);
function walk(directory = ROOT) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) { errors.push(`Symlinks are not portable distribution sources: ${path}`); continue; }
    if (entry.isDirectory()) {
      if (entry.name === 'sessions' || entry.name === '.0xfun' || entry.name === '.pi') errors.push(`Private state directory inside checkout: ${path}`);
      else walk(path);
      continue;
    }
    if (forbiddenFiles.has(entry.name)) errors.push(`Private/machine file inside checkout: ${path}`);
    const text = readFileSync(path, 'utf8');
    const home = homedir();
    // /root/... is a common public CTF target path, not a personal host path.
    if (home.length > 3 && home !== '/root' && text.includes(home + sep)) errors.push(`Personal home path embedded in source: ${path}`);
    if (/license:\s*Proprietary|© 2025 Anthropic, PBC\. All rights reserved/.test(text)) errors.push(`Restricted skill contents inside checkout: ${path}`);
    // Technique references contain intentionally illustrative exploit material;
    // check credentials in application/configuration code, not example keys in lessons.
    if (!path.includes(`${sep}profile${sep}skills${sep}`)) {
      if (/\bsk-(?:proj-)?[A-Za-z0-9_-]{40,}\b/.test(text)) errors.push(`Possible real API key inside source: ${path}`);
      if (/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/.test(text)) errors.push(`Possible GitHub credential inside source: ${path}`);
    }
  }
}
walk();
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`0xfun v${manifest.version}: ${Object.keys(inventory.files).length} resource hashes verified; dependencies pinned; no personal state or restricted skill contents found.`);
}
