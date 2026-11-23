import { z } from 'zod';
import { run } from '../../cli/run.js';
export const AdapterRequestSchema = z.object({ args: z.array(z.string().max(10000)).min(1).max(50), workspace: z.string().trim().min(1).max(4096) }).strict();
/** No shell; the same CLI parser validates the fixed command grammar. */
export async function executeRequest(input: unknown) {
  const request = AdapterRequestSchema.parse(input);
  if (request.args.includes('--workspace')) throw new Error('Set workspace only in the request workspace field');
  return run(['--workspace', request.workspace, ...request.args]);
}
