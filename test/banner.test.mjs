import assert from 'node:assert/strict';
import { test } from 'node:test';
import { homedir, tmpdir } from 'node:os';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { ROOT } from '../lib/paths.mjs';
import { prepareRuntime } from '../lib/runtime.mjs';
import { visibleWidth } from '@earendil-works/pi-tui';

const runtime = prepareRuntime();
const { loadExtensions } = await import(pathToFileURL(join(runtime, 'dist/core/extensions/loader.js')));
async function load() {
  const result = await loadExtensions([join(ROOT, 'profile/extensions/0xfun-banner.ts')], ROOT);
  assert.deepEqual(result.errors, []);
  return result.extensions[0];
}
function context(mode = 'tui') {
  const state = { renders: 0, header: undefined, footer: undefined, titles: [] };
  const tui = { requestRender: () => state.renders++ };
  const theme = { fg: (_, text) => text, bold: (text) => text };
  return { state, ctx: { mode, cwd: join(homedir(), 'Downloads'), model: { id: 'fixture-model' }, ui: {
    setHeader(factory) { state.header?.dispose(); state.header = factory?.(tui, theme); },
    setFooter(factory) { state.footer = factory?.(tui, theme); },
    setTitle(title) { state.titles.push(title); },
  } } };
}
async function emit(extension, type, ctx, extra = {}) {
  for (const handler of extension.handlers.get(type) ?? []) await handler({ type, ...extra }, ctx);
}

test('banner is width-safe, shows v1.1/current model/directory, and updates on model selection', async () => {
  const extension = await load();
  const { state, ctx } = context();
  await emit(extension, 'session_start', ctx, { reason: 'reload' });
  try {
    for (let width = 1; width <= 200; width++) for (const line of state.header.render(width)) assert.ok(visibleWidth(line) <= width);
    const text = state.header.render(100).join('\n');
    assert.ok(text.includes('0xfun v1.1 · CTF agent'));
    assert.ok(text.includes('Model: fixture-model'));
    assert.ok(text.includes('Dir:   ' + join('~', 'Downloads')));
    assert.ok(text.includes('Type to chat'));
    assert.deepEqual(state.footer.render(100), []);
    await emit(extension, 'model_select', ctx, { model: { id: 'updated-model' } });
    assert.ok(state.header.render(100).join('\n').includes('Model: updated-model'));
    assert.equal(state.renders, 1);
  } finally { await emit(extension, 'session_shutdown', ctx); }
});

test('home-relative paths survive symlinked homes and Windows junctions', async () => {
  const directory = mkdtempSync(join(tmpdir(), '0xfun-home-path-'));
  const home = join(directory, 'real-home');
  const alias = join(directory, 'home-alias');
  mkdirSync(join(home, 'Downloads'), { recursive: true });
  symlinkSync(home, alias, 'junction');
  const previousHome = process.env.HOME, previousProfile = process.env.USERPROFILE;
  let extension, ctx;
  try {
    process.env.HOME = alias;
    process.env.USERPROFILE = alias;
    extension = await load();
    const ui = context(); ctx = ui.ctx;
    ctx.cwd = realpathSync.native(join(home, 'Downloads'));
    await emit(extension, 'session_start', ctx, { reason: 'reload' });
    assert.ok(ui.state.header.render(100).join('\n').includes('Dir:   ' + join('~', 'Downloads')));
  } finally {
    if (extension && ctx) await emit(extension, 'session_shutdown', ctx);
    if (previousHome === undefined) delete process.env.HOME; else process.env.HOME = previousHome;
    if (previousProfile === undefined) delete process.env.USERPROFILE; else process.env.USERPROFILE = previousProfile;
    rmSync(directory, { recursive: true, force: true });
  }
});

test('animation has deliberate delays, finishes at 4.5 seconds, and releases its timers', async () => {
  const extension = await load();
  const { state, ctx } = context();
  await emit(extension, 'session_start', ctx, { reason: 'startup' });
  try {
    await delay(1000);
    assert.ok(state.renders >= 3 && state.renders < 18);
    await delay(1000);
    assert.ok(!state.header.render(100).join('\n').includes('@@'));
    await delay(2800);
    assert.ok(state.header.render(100).join('\n').includes('@@'));
    assert.equal(state.renders, 18);
    const renders = state.renders;
    await delay(150);
    assert.equal(state.renders, renders);
  } finally { await emit(extension, 'session_shutdown', ctx); }
});

test('non-terminal modes do not render a splash, footer, or title', async () => {
  const extension = await load();
  for (const mode of ['rpc', 'print', 'json']) {
    const { state, ctx } = context(mode);
    await emit(extension, 'session_start', ctx, { reason: 'startup' });
    await extension.commands.get('banner').handler('', ctx);
    assert.equal(state.header, undefined);
    assert.equal(state.footer, undefined);
    assert.deepEqual(state.titles, []);
  }
});
