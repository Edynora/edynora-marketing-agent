#!/usr/bin/env node
import { run, errorResult } from './run.js';
try { console.log(JSON.stringify({ ok: true, data: await run(process.argv.slice(2)) }, null, 2)); }
catch (error) { console.error(JSON.stringify({ ok: false, error: errorResult(error) }, null, 2)); process.exitCode = 1; }
