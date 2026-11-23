import { join, resolve } from 'node:path';
import { z } from 'zod';
import { Engine } from '../core/index.js';
import { BrandSchema, FormatSchema } from '../shared/schemas.js';
import { Store, readInput, AppError } from '../shared/store.js';
import { VERSION } from '../shared/version.js';

export const help = `Edynora Marketing Agent ${VERSION} — offline template drafts, no publishing
Usage: edynora [--workspace PATH] COMMAND [--option VALUE]
brand create|import|validate --file FILE
brand edit --id ID --file PATCH.json
brand export --id ID --out brand.json
ingest --file FILE --kind transcript|markdown|text|script|product|brief --title TITLE
contract import --file FILE
contract export --id SOURCE_ID --out video.json
repurpose --brand ID --source ID --platforms linkedin,facebook,instagram,x,youtube,shorts,newsletter,blog,email
strategy --brand ID
calendar --brand ID --source ID --days 7|30 --start YYYY-MM-DD
email --brand ID --source ID --type welcome|newsletter|launch|webinar|follow-up
list --type brands|sources|items
show --type brands|sources|items --id ID
edit --id ITEM_ID --file PATCH.json --reason TEXT
quality --id ITEM_ID
review --id ITEM_ID
approve --id ITEM_ID --version N --reviewer NAME --note TEXT
export --ids ID,ID --format json|csv|markdown --out FILENAME
doctor
All responses are JSON envelopes. Errors use stderr and exit code 1.
--workspace defaults to EDYNORA_WORKSPACE or .edynora in the current directory.
Exports stay inside the workspace/exports directory. Nothing is published or sent.`;

function parse(args: string[]) {
  const words: string[] = []; const options: Record<string, string> = {};
  for (let n = 0; n < args.length; n++) {
    const value = args[n]!;
    if (value.startsWith('--')) {
      const key = value.slice(2); if (options[key] !== undefined) throw new AppError('USAGE', 'Duplicate option');
      const next = args[++n]; if (next === undefined || next.startsWith('--')) throw new AppError('USAGE', 'Every option requires a value'); options[key] = next;
    } else words.push(value);
  }
  return { words, options };
}
export async function run(args: string[]): Promise<unknown> {
  if (!args.length || args.includes('--help') || args.includes('-h')) return { help };
  const { words, options: o } = parse(args); const command = words.join(' ');
  const allowed: Record<string, string[]> = {
    'brand create': ['file'], 'brand import': ['file'], 'brand validate': ['file'], 'brand edit': ['id', 'file'], 'brand export': ['id', 'out'],
    ingest: ['file', 'kind', 'title'], 'contract import': ['file'], 'contract export': ['id', 'out'],
    repurpose: ['brand', 'source', 'platforms'], strategy: ['brand'], calendar: ['brand', 'source', 'days', 'start'], email: ['brand', 'source', 'type'],
    list: ['type'], show: ['type', 'id'], edit: ['id', 'file', 'reason'], quality: ['id'], review: ['id'], approve: ['id', 'version', 'reviewer', 'note'], export: ['ids', 'format', 'out'], doctor: [],
  };
  if (!(command in allowed)) throw new AppError('USAGE', 'Unknown command; run edynora --help');
  if (Object.keys(o).some(key => key !== 'workspace' && !allowed[command]!.includes(key))) throw new AppError('USAGE', 'Unknown option for this command');
  function get(key: string) { if (!o[key]?.trim()) throw new AppError('USAGE', `Missing --${key}`); return o[key]!; }
  const e = new Engine(o.workspace ?? process.env.EDYNORA_WORKSPACE ?? resolve('.edynora'));
  const file = async () => JSON.parse((await readInput(get('file'))).replace(/^\uFEFF/, '')) as unknown;
  const save = async (data: unknown) => ({ path: await new Store(join(e.store.root, 'exports')).atomic(get('out'), JSON.stringify(data, null, 2) + '\n') });
  switch (command) {
    case 'brand create': return e.createBrand(await file());
    case 'brand import': return e.importBrand(await file());
    case 'brand validate': return { valid: true, profile: BrandSchema.parse(await file()) };
    case 'brand edit': return e.editBrand(get('id'), await file());
    case 'brand export': return save(await e.exportBrand(get('id')));
    case 'ingest': return e.ingest({ kind: get('kind'), title: get('title'), text: await readInput(get('file'), 1_048_576) });
    case 'contract import': return e.importVideo(await file());
    case 'contract export': return save(await e.exportVideo(get('id')));
    case 'repurpose': return e.repurpose(get('brand'), get('source'), get('platforms').split(','));
    case 'strategy': return e.strategy(get('brand'));
    case 'calendar': return e.calendar(get('brand'), get('source'), Number(get('days')), get('start'));
    case 'email': return e.email(get('brand'), get('source'), get('type'));
    case 'list': case 'show': {
      const type = z.enum(['brands', 'sources', 'items']).parse(get('type')); const records = (await e.state())[type];
      if (command === 'list') return records;
      const record = records.find(x => x.id === get('id')); if (!record) throw new AppError('NOT_FOUND', 'Requested record does not exist'); return record;
    }
    case 'edit': return e.editItem(get('id'), await file(), get('reason'));
    case 'quality': return e.quality(get('id'));
    case 'review': return e.requestReview(get('id'));
    case 'approve': return e.approve(get('id'), z.number().int().positive().parse(Number(get('version'))), get('reviewer'), get('note'));
    case 'export': return e.exportItems(get('ids').split(','), FormatSchema.parse(get('format')), get('out'));
    case 'doctor': return { version: VERSION, node: process.version, workspace: e.store.root, generationMethod: 'template-v1', modelProvider: null, publishing: false, telemetry: false };
  }
}
export function errorResult(error: unknown) {
  if (error instanceof z.ZodError) return { code: 'VALIDATION_ERROR', message: 'Input validation failed', issues: error.issues.map(i => ({ path: i.path.join('.'), code: i.code })) };
  if (error instanceof AppError) return { code: error.code, message: error.message };
  if (error instanceof SyntaxError) return { code: 'INVALID_JSON', message: 'Input is not valid JSON' };
  const code = (error as NodeJS.ErrnoException)?.code;
  if (code) return { code, message: 'File operation failed; check paths, access permissions and workspace health' };
  return { code: 'WORKFLOW_ERROR', message: error instanceof Error ? error.message : 'Workflow failed' };
}
