#!/usr/bin/env node
import { executeRequest } from '../dist/packages/adapters/claude-code/index.js';
import { readInput } from '../dist/packages/shared/store.js';
import { errorResult } from '../dist/packages/cli/run.js';
try {
  if (process.argv.length !== 3) throw new Error('Usage: node claude-bridge.mjs REQUEST.json');
  const input = JSON.parse((await readInput(process.argv[2], 100_000)).replace(/^\uFEFF/, ''));
  console.log(JSON.stringify({ ok: true, data: await executeRequest(input) }, null, 2));
} catch (error) { console.error(JSON.stringify({ ok: false, error: errorResult(error) }, null, 2)); process.exitCode = 1; }
