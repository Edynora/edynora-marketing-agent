import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const consumer = await mkdtemp(join(await realpath(tmpdir()), 'edynora-packed-'));
const npmPath = process.env.npm_execpath;
if (!npmPath) throw new Error('Run this check through npm run test:package');
const run = (command, args, cwd) => {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', shell: false, timeout: 120000 });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout;
};
try {
  run(process.execPath, [npmPath, 'install', '--prefix', consumer, '--ignore-scripts', '--offline', '--no-audit', '--no-fund', resolve(`edynora-marketing-agent-${pkg.version}.tgz`)], consumer);
  const cli = join(consumer, 'node_modules', pkg.name, 'dist/packages/cli/index.js');
  const args = ['--workspace', join(consumer, 'marketing-data')];
  const doctor = JSON.parse(run(process.execPath, [cli, ...args, 'doctor'], consumer)).data;
  assert.equal(doctor.version, pkg.version); assert.equal(doctor.publishing, false);
  const brand = JSON.parse(run(process.execPath, [cli, ...args, 'brand', 'create', '--file', resolve('examples/edynora.brand.json')], consumer)).data;
  assert.equal(brand.businessName, 'Edynora');
  console.log(JSON.stringify({ passed: true, version: pkg.version, offlineInstall: true, doctor: true, brandCreation: true }));
} finally { await rm(consumer, { recursive: true, force: true }); }
