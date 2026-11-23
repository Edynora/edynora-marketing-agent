// Opt-in live acceptance through an existing Claude subscription. API-key auth is refused.
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import { Engine } from '../dist/packages/core/index.js';
import { draft } from '../dist/packages/content/index.js';

if (!process.argv.includes('--use-existing-subscription')) throw new Error('Explicit --use-existing-subscription is required; no API-key fallback is permitted');
const root = resolve('.'); const scratch = resolve('../../work'); await mkdir(scratch, { recursive: true });
const fixture = await mkdtemp(join(scratch, 'claude-live-'));
const workspace = join(fixture, 'marketing-data'); const engine = new Engine(workspace);
const brand = await engine.createBrand(JSON.parse(await readFile('examples/edynora.brand.json', 'utf8')));
const source = await engine.ingest({ kind: 'transcript', title: 'Synthetic workflow acceptance fixture', text: 'Document your current workflow. Identify repeated tasks. Review automation outputs before using them.' });
const expectedBody = draft(brand, source, 'linkedin').body;
const bridge = join(root, 'scripts/claude-bridge.mjs').replaceAll('\\', '/');
const env = { ...process.env, CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1', DISABLE_AUTOUPDATER: '1', DISABLE_TELEMETRY: '1', DISABLE_ERROR_REPORTING: '1' };
for (const key of ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'CLAUDE_CODE_OAUTH_TOKEN', 'ANTHROPIC_BASE_URL', 'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX', 'CLAUDE_CODE_USE_FOUNDRY']) delete env[key];
const claude = process.env.CLAUDE_BIN ?? 'claude';
const auth = spawnSync(claude, ['auth', 'status', '--json'], { env, encoding: 'utf8', shell: false, timeout: 15000 });
if (auth.error) throw auth.error;
const account = JSON.parse(auth.stdout);
if (auth.status !== 0 || !account.loggedIn || account.authMethod !== 'claude.ai' || !account.subscriptionType) throw new Error('An existing Claude subscription login is required. Refusing API-key fallback.');
const prompt = `/edynora-marketing-agent:marketing Run a SYNTHETIC QA acceptance test, not real marketing. Use only the supplied local workspace and Node JSON bridge. No network tools, provider calls, publishing, sending or installing. The core generation must remain template-v1.\n\nWorkspace: ${workspace}\nBridge: ${bridge}\nBrand ID: ${brand.id}\nSource ID: ${source.id}\n\nUse Write to create JSON request files in ${fixture}, then Bash only to run node with the quoted bridge path and request file. Each Bash call MUST contain exactly ONE node command with the literal quoted bridge path and literal request path. Do not use shell variables, echo, find, for, loops, pipes, semicolons, or command chaining. If a compound command is denied, retry with separate single-node calls; do not request broader permissions. Each request is {"workspace":${JSON.stringify(workspace)},"args":[command strings]}. Inspect the JSON results. Follow this sequence:\n1. repurpose --brand ${brand.id} --source ${source.id} --platforms linkedin. Capture the single item ID and version.\n2. show --type items --id ITEM and quality --id ITEM; inspect the source if needed with show --type sources.\n3. Try export --ids ITEM --format json --out unapproved.json. It MUST return APPROVAL_REQUIRED and create no file.\n4. Write a patch JSON file containing {"topic":"Reviewed synthetic acceptance topic"}. Call edit --id ITEM --file PATCH_PATH --reason "Synthetic QA topic edit". Confirm version 2 and draft status. Do not modify body or CTA.\n5. review --id ITEM. For this synthetic fixture only, QA explicitly authorizes approval of version 2 ONLY IF the body exactly equals the predeclared body below, the source ID is ${source.id}, and status is review-required. This is an automated fixture approval, not approval of real user marketing. Call approve --id ITEM --version 2 --reviewer "Automated synthetic QA" --note "Fixture-only acceptance approval; not real marketing authorization".\n6. export --ids ITEM --format json --out approved.json. Confirm the file is local and published:false.\n7. edit the topic again to "Post-approval synthetic edit" using another patch and reason "Verify approval invalidation". Confirm version 3, draft status and no approval. Try export --ids ITEM --format json --out stale.json. It MUST return APPROVAL_REQUIRED.\n\nPredeclared authorized body:\n${expectedBody}\n\nFinish with EDYNORA_SUBSCRIPTION_ACCEPTANCE_PASSED only if every step succeeded as specified. On a failure, explain it and stop. Do not request broader permissions or use alternate tools.`;
const args = ['--print', prompt, '--plugin-dir', root, '--output-format', 'json', '--model', 'sonnet', '--no-session-persistence', '--no-chrome', '--setting-sources', '', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--permission-mode', 'dontAsk', '--tools', 'Bash,Read,Write', '--allowedTools', 'Bash(node *)', 'Read', 'Write', '--max-turns', '24', '--max-budget-usd', '1'];
const child = spawn(claude, args, { env, cwd: fixture, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
let stdout = '', stderr = ''; child.stdout.on('data', chunk => stdout += chunk); child.stderr.on('data', chunk => stderr += chunk);
const timer = setTimeout(() => child.kill(), 300000);
try {
  const code = await new Promise((resolveCode, reject) => { child.on('error', reject); child.on('close', resolveCode); });
  await writeFile(join(fixture, 'session-result.json'), stdout); await writeFile(join(fixture, 'session-stderr.txt'), stderr);
  let result; try { result = JSON.parse(stdout); } catch { throw new Error('Claude did not return a JSON result; inspect the private fixture logs'); }
  assert.equal(code, 0, 'Claude process failed'); assert.equal(result.is_error, false, 'Claude reported an error');
  assert.equal(result.permission_denials?.length ?? 0, 0, 'A command was denied; inspect the private fixture logs');
  assert.equal(result.result?.trim().split(/\r?\n/).at(-1), 'EDYNORA_SUBSCRIPTION_ACCEPTANCE_PASSED', 'The live model did not confirm all acceptance steps');
  const state = await engine.state(); assert.equal(state.items.length, 1);
  const item = state.items[0]; assert.equal(item.version, 3); assert.equal(item.status, 'draft'); assert.equal(item.approval, undefined); assert.equal(item.body, expectedBody);
  const exported = JSON.parse(await readFile(join(workspace, 'exports/approved.json'), 'utf8'));
  assert.equal(exported[0].version, 2); assert.equal(exported[0].status, 'exported'); assert.equal(exported[0].approval.reviewer, 'Automated synthetic QA');
  for (const name of ['unapproved.json', 'stale.json']) { let exists = true; try { await readFile(join(workspace, 'exports', name)); } catch (error) { if (error.code === 'ENOENT') exists = false; else throw error; } assert.equal(exists, false, `${name} must not exist`); }
  const evidence = { passed: true, authMethod: 'claude.ai', subscriptionType: account.subscriptionType, apiKeyCredentialsRemoved: true, apiKeyFallbackPermitted: false, paidApiKeyCalls: 0, model: 'sonnet', generationMethod: 'template-v1', turns: result.num_turns, checks: { repurpose: true, inspectAndQuality: true, unapprovedExportRejected: true, editCreatesNewVersion: true, syntheticApprovalAndExport: true, subsequentEditInvalidatesApproval: true, staleExportRejected: true }, publishedMarketing: false };
  await writeFile('docs/claude-subscription-evidence.json', JSON.stringify(evidence, null, 2)); console.log(JSON.stringify(evidence, null, 2));
} finally { clearTimeout(timer); }
