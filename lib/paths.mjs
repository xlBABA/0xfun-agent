import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

export function expandHome(value, home = homedir()) {
  if (value === '~') return home;
  if (value.startsWith('~/') || value.startsWith('~\\')) return join(home, value.slice(2));
  return value;
}

export function profilePaths(env = process.env, home = homedir()) {
  const configured = env.OXFUN_HOME;
  const base = configured ? expandHome(configured, home) : join(home, '.0xfun');
  if (!isAbsolute(base)) throw new Error('OXFUN_HOME must be an absolute path (or start with ~/).');
  return { home: resolve(base), agent: join(base, 'agent'), runtime: join(ROOT, '.runtime') };
}
