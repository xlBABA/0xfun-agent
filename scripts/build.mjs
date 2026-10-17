import { prepareRuntime, manifest } from '../lib/runtime.mjs';
const runtime = prepareRuntime();
console.log(`0xfun v${manifest.version} runtime prepared at ${runtime}`);
