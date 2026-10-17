import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createJiti } from 'jiti';
import { prepareRuntime } from '../../lib/runtime.mjs';
import { ensureProfile, configureEnvironment } from '../../lib/profile.mjs';
import { ROOT } from '../../lib/paths.mjs';

const runtime = prepareRuntime();
const paths = ensureProfile();
configureEnvironment(paths, runtime);
process.argv[1] = join(runtime, 'dist/cli.js');
const { DefaultResourceLoader, SettingsManager, CONFIG_DIR_NAME, getAgentDir } = await import(pathToFileURL(join(runtime, 'dist/index.js')));
const { APP_NAME } = await import(pathToFileURL(join(runtime, 'dist/config.js')));
const settingsManager = SettingsManager.create(process.cwd(), paths.agent, { projectTrusted: false });
const loader = new DefaultResourceLoader({ cwd: process.cwd(), agentDir: paths.agent, settingsManager });
await loader.reload();
const jiti = createJiti(import.meta.url);
const spawn = await jiti.import(join(ROOT, 'node_modules/pi-subagents/src/runs/shared/pi-spawn.ts'));
const utils = await jiti.import(join(ROOT, 'node_modules/pi-subagents/src/shared/utils.ts'));
console.log(JSON.stringify({
  name: APP_NAME, configDir: CONFIG_DIR_NAME, agentDir: getAgentDir(),
  errors: loader.getExtensions().errors,
  skills: loader.getSkills().skills.map((skill) => skill.name),
  diagnostics: loader.getSkills().diagnostics,
  prompts: loader.getPrompts().prompts.map((prompt) => prompt.name),
  tools: loader.getExtensions().extensions.flatMap((extension) => [...extension.tools.keys()]),
  commands: loader.getExtensions().extensions.flatMap((extension) => [...extension.commands.keys()]),
  contexts: loader.getAgentsFiles().agentsFiles.map((file) => file.path),
  child: spawn.getPiSpawnCommand(['--version']),
  childConfigDir: utils.getConfigDirName(),
  childAgentDir: utils.getAgentDir(),
}));
