import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, profilePaths } from './paths.mjs';
import { manifest } from './runtime.mjs';

const hash = (data) => createHash('sha256').update(data).digest('hex');
const readJSON = (path) => JSON.parse(readFileSync(path, 'utf8'));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function atomicWrite(path, data) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  writeFileSync(temporary, data, { mode: 0o600 });
  renameSync(temporary, path);
}

// Only initial defaults and distribution-owned, unedited instruction files are
// managed. Existing credentials, models, sessions, and user preferences are never copied.
export function ensureProfile(env = process.env) {
  const paths = profilePaths(env);
  mkdirSync(paths.agent, { recursive: true, mode: 0o700 });
  const statePath = join(paths.agent, 'distribution.json');
  const settingsPath = join(paths.agent, 'settings.json');
  const previous = existsSync(statePath) ? readJSON(statePath) : {};
  const defaults = readJSON(join(ROOT, 'profile/settings.json'));
  const existing = existsSync(settingsPath) ? readJSON(settingsPath) : {};
  if (!existing || typeof existing !== 'object' || Array.isArray(existing)) throw new Error(`Invalid settings object: ${settingsPath}`);
  const before = JSON.stringify(existing);
  const settings = { ...defaults, ...existing };
  const packages = settings.packages ?? [];
  if (!Array.isArray(packages)) throw new Error(`settings.packages must be an array: ${settingsPath}`);
  const isManaged = (item) => (typeof item === 'string' ? item : item?.source) === previous.packageRoot;
  const migrated = previous.packageRoot && previous.packageRoot !== ROOT ? packages.map((item) => isManaged(item) ? (typeof item === 'string' ? ROOT : { ...item, source: ROOT }) : item) : packages;
  if (!migrated.some((item) => (typeof item === 'string' ? item : item?.source) === ROOT)) migrated.unshift(ROOT);
  settings.packages = migrated;
  // Mark our own release as seen without displaying upstream changelog notices.
  if (!previous.version || settings.lastChangelogVersion === previous.version) settings.lastChangelogVersion = manifest.version;
  if (!existsSync(settingsPath) || JSON.stringify(settings) !== before) atomicWrite(settingsPath, JSON.stringify(settings, null, 2) + '\n');

  const files = {};
  for (const [name, source] of [['AGENTS.md', join(ROOT, 'AGENTS.md')], ['APPEND_SYSTEM.md', join(ROOT, 'profile/APPEND_SYSTEM.md')]]) {
    const destination = join(paths.agent, name);
    const desired = readFileSync(source);
    const digest = hash(desired);
    const current = existsSync(destination) ? readFileSync(destination) : undefined;
    const unmodified = current && previous.files?.[name] === hash(current);
    if (!current || (unmodified && hash(current) !== digest)) atomicWrite(destination, desired);
    files[name] = !current || unmodified || hash(current) === digest ? digest : previous.files?.[name] ?? null;
  }
  const state = { version: manifest.version, packageRoot: ROOT, files };
  if (!existsSync(statePath) || !equal(state, previous)) atomicWrite(statePath, JSON.stringify(state, null, 2) + '\n');
  return paths;
}

export function configureEnvironment(paths, runtime, env = process.env) {
  env.PI_PACKAGE_DIR = runtime;
  env['0XFUN_CODING_AGENT_DIR'] = paths.agent;
  env.PI_CODING_AGENT_DIR = paths.agent; // Compatibility for bundled extensions.
  env.PI_SUBAGENTS_PI_CODING_AGENT_PACKAGE_ROOT = runtime;
  if (env.OXFUN_SESSION_DIR) env['0XFUN_CODING_AGENT_SESSION_DIR'] = env.OXFUN_SESSION_DIR;
  env.PI_TELEMETRY = '0';
  env.PI_SKIP_VERSION_CHECK = '1';
  if (env.OXFUN_STARTUP_CHECKS !== '1') env.PI_OFFLINE = '1';
}
