import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const scratch = resolve('../../work'); await mkdir(scratch, { recursive: true });
const config = await mkdtemp(join(scratch, 'claude-install-'));
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
// Use the prepared distribution, not an uncommitted Git checkout.
const staging = join(config, 'prepared'); await mkdir(staging);
let root = process.env.EDYNORA_PLUGIN_ROOT ? resolve(process.env.EDYNORA_PLUGIN_ROOT) : join(staging, 'package');
if (!process.env.EDYNORA_PLUGIN_ROOT) {
  const unpack = spawnSync('tar', ['-xzf', resolve(`edynora-marketing-agent-${version}.tgz`), '-C', staging], { encoding: 'utf8', shell: false });
  if (unpack.status !== 0) throw new Error('Run npm pack --ignore-scripts first; extracting the prepared plugin failed');
}
const env = { ...process.env, CLAUDE_CONFIG_DIR: config, DISABLE_AUTOUPDATER: '1', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' };
const claude = process.env.CLAUDE_BIN ?? 'claude';
function run(args) {
  const result = spawnSync(claude, args, { env, encoding: 'utf8', timeout: 60000, shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Claude command failed: ${result.stdout}\n${result.stderr}`);
  return result.stdout;
}
const validation = JSON.parse(run(['plugin', 'validate', root, '--strict', '--json']));
if (!validation.success || !validation.provides.skills.includes('edynora-marketing-agent:marketing')) throw new Error('Skill not found by official validator');
const installed = run(['plugin', 'install', 'edynora-marketing-agent', '--marketplace', root, '--scope', 'user', '--json']);
const listing = run(['plugin', 'list', '--json']);
const plugins = JSON.parse(listing);
const plugin = plugins.find(p => p.id === 'edynora-marketing-agent@edynora-local');
if (!plugin?.enabled) throw new Error('Installed plugin is not enabled');
const runtimeRoot = plugin.readFromFolder ?? plugin.installPath;
const request = join(config, 'request.json');
await writeFile(request, JSON.stringify({ workspace: join(config, 'marketing-data'), args: ['doctor'] }));
const bridge = spawnSync(process.execPath, [join(runtimeRoot, 'scripts/claude-bridge.mjs'), request], { encoding: 'utf8', shell: false });
if (bridge.status !== 0 || JSON.parse(bridge.stdout).data.generationMethod !== 'template-v1') throw new Error('Installed adapter bridge failed');
const result = { claudeVersion: run(['--version']).trim(), validation, installed: JSON.parse(installed), listing: plugins, installedBridgeTested: true, config, modelSessionTested: false, paidRequests: 0 };
await writeFile('docs/plugin-install-evidence.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ validated: true, installed: result.installed, config, modelSessionTested: false }, null, 2));
