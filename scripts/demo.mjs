import { mkdtemp, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
await import('node:fs/promises').then(fs => fs.mkdir('work', { recursive: true }));
const workspace = await mkdtemp(resolve('work/demo-'));
const cli = resolve('dist/packages/cli/index.js');
const run = (...args) => JSON.parse(execFileSync(process.execPath, [cli, '--workspace', workspace, ...args], { encoding: 'utf8' })).data;
const brand = run('brand', 'create', '--file', 'examples/edynora.brand.json');
const source = run('ingest', '--file', 'examples/workflow.md', '--kind', 'markdown', '--title', 'Review a workflow');
const items = run('repurpose', '--brand', brand.id, '--source', source.id, '--platforms', 'linkedin,x,youtube');
const calendar = run('calendar', '--brand', brand.id, '--source', source.id, '--days', '7', '--start', '2026-12-01');
const emails = run('email', '--brand', brand.id, '--source', source.id, '--type', 'welcome');
for (const item of [...items, ...calendar, ...emails]) {
  run('review', '--id', item.id);
  run('approve', '--id', item.id, '--version', '1', '--reviewer', 'Fixture reviewer', '--note', 'Automated synthetic demo approval only; not approval of real marketing');
}
const ids = [...items, ...calendar, ...emails].map(i => i.id).join(',');
const outputs = ['json', 'csv', 'markdown'].map(f => run('export', '--ids', ids, '--format', f, '--out', `campaign.${f === 'markdown' ? 'md' : f}`));
const summary = { workspace, brandId: brand.id, sourceId: source.id, items: items.length, calendarDays: calendar.length, emails: emails.length, outputs, published: false };
await writeFile(join(workspace, 'demo-result.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
