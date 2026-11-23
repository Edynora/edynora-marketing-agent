import { it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = resolve('dist/packages/cli/index.js');
let root: string;
beforeEach(async () => { root = await mkdtemp(join(tmpdir(), 'edynora-cli-')); });
afterEach(async () => { await rm(root, { recursive: true, force: true }); });
function run(...args: string[]) { return JSON.parse(execFileSync(process.execPath, [cli, '--workspace', root, ...args], { encoding: 'utf8' })).data; }
it('executes the complete standalone CLI workflow', () => {
  const b = run('brand', 'create', '--file', 'examples/edynora.brand.json');
  const s = run('ingest', '--file', 'examples/workflow.md', '--kind', 'markdown', '--title', 'Workflow design');
  const [item] = run('repurpose', '--brand', b.id, '--source', s.id, '--platforms', 'linkedin,x');
  expect(run('strategy', '--brand', b.id).assumptions.length).toBeGreaterThan(0);
  expect(run('calendar', '--brand', b.id, '--source', s.id, '--days', '7', '--start', '2026-12-01')).toHaveLength(7);
  expect(run('email', '--brand', b.id, '--source', s.id, '--type', 'welcome')).toHaveLength(3);
  expect(run('quality', '--id', item.id).findings.length).toBeGreaterThan(0);
  run('review', '--id', item.id); run('approve', '--id', item.id, '--version', '1', '--reviewer', 'QA', '--note', 'Checked original and brand');
  expect(run('export', '--ids', item.id, '--format', 'csv', '--out', 'approved.csv').published).toBe(false);
  expect(run('list', '--type', 'items').find((x: { id: string }) => x.id === item.id).status).toBe('exported');
  expect(run('show', '--type', 'sources', '--id', s.id).title).toBe('Workflow design');
  expect(run('doctor').generationMethod).toBe('template-v1');
});
it('returns structured errors, rejects unknown options and does not reveal input', async () => {
  for (const args of [['unknown'], ['calendar', '--days', 'oops'], ['doctor', '--unknown', 'x']]) {
    const p = spawnSync(process.execPath, [cli, '--workspace', root, ...args], { encoding: 'utf8' });
    expect(p.status).toBe(1); expect(JSON.parse(p.stderr).ok).toBe(false); expect(p.stdout).toBe('');
  }
  const invalid = join(root, 'invalid.json'); await writeFile(invalid, '{"businessName":"PRIVATE_SECRET"}');
  const p = spawnSync(process.execPath, [cli, '--workspace', root, 'brand', 'create', '--file', invalid], { encoding: 'utf8' });
  expect(p.stderr).not.toContain('PRIVATE_SECRET'); expect(JSON.parse(p.stderr).error.code).toBe('VALIDATION_ERROR');
});
it('runs the Claude adapter through a JSON request without shell interpolation', async () => {
  const file = join(root, 'request.json'); await writeFile(file, JSON.stringify({ args: ['doctor'], workspace: root }));
  const result = JSON.parse(execFileSync(process.execPath, ['scripts/claude-bridge.mjs', file], { encoding: 'utf8' }));
  expect(result.data.generationMethod).toBe('template-v1');
  await writeFile(file, JSON.stringify({ args: ['doctor; echo bad'], workspace: root }));
  const p = spawnSync(process.execPath, ['scripts/claude-bridge.mjs', file], { encoding: 'utf8' }); expect(p.status).toBe(1);
});
