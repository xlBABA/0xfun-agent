import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../lib/paths.mjs';
import { manifest, prepareRuntime } from '../lib/runtime.mjs';

const args = process.argv.slice(2);
const prefixIndex = args.indexOf('--prefix');
if (prefixIndex !== -1 && (!args[prefixIndex + 1] || args[prefixIndex + 1].startsWith('-'))) throw new Error('--prefix requires an installation directory.');
const runtime = prepareRuntime();
if (args.includes('--no-link')) {
  console.log(`0xfun v${manifest.version} built: ${runtime}\nRun: node bin/0xfun.mjs`);
} else {
  const npmCli = process.env.npm_execpath;
  if (!npmCli || !existsSync(npmCli)) throw new Error('Run this installer with npm run setup (not directly with node).');
  // An explicit local folder + install-links=false installs a real global
  // command linked to this checkout, without resolving a registry name.
  // Unlike `npm link --prefix`, this does not mistake the prefix for the project.
  const linkArgs = ['install', '--global', '--install-links=false', '--ignore-scripts', '--no-audit', '--no-fund', ROOT];
  if (prefixIndex !== -1) linkArgs.push('--prefix', args[prefixIndex + 1]);
  const result = spawnSync(process.execPath, [npmCli, ...linkArgs], { cwd: ROOT, stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error('\n0xfun command installation failed. No sudo is required: choose a user-owned prefix.\n  npm run setup -- --prefix "$HOME/.local"\nThen add its bin directory to PATH. See README.md for Windows and permissions help.');
    process.exitCode = result.status ?? 1;
  } else {
    const prefix = prefixIndex !== -1 ? args[prefixIndex + 1] : undefined;
    console.log(`\n0xfun v${manifest.version} installed. Run: 0xfun\nNo alias is needed. Keep this checkout: the installed command links to it.`);
    if (prefix) {
      const bin = process.platform === 'win32' ? prefix : join(prefix, 'bin');
      console.log(`Command directory: ${bin}\nIf it is not already on PATH, add it and reopen your terminal.`);
    }
  }
}
