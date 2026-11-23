// Entire model transport is a local deterministic fixture. No paid API is called.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const root = resolve('.'); const scratch = resolve('../../work'); await mkdir(scratch, { recursive: true });
const config = await mkdtemp(join(scratch, 'claude-session-'));
const requestPath = join(config, 'request.json');
await writeFile(requestPath, JSON.stringify({ workspace: join(config, 'data'), args: ['doctor'] }));
const slash = p => p.replaceAll('\\', '/');
const command = `node "${slash(join(root, 'scripts/claude-bridge.mjs'))}" "${slash(requestPath)}"`;
let messageCalls = 0; let expandedCommand = false; let resultObserved = false;
const server = createServer(async (req, res) => {
  let raw = ''; for await (const chunk of req) raw += chunk;
  if (req.url?.includes('count_tokens')) { res.setHeader('content-type', 'application/json'); return res.end('{"input_tokens":1}'); }
  if (!req.url?.includes('/messages')) { res.setHeader('content-type', 'application/json'); return res.end('{}'); }
  const body = JSON.parse(raw); messageCalls++;
  const allText = JSON.stringify(body.messages);
  expandedCommand ||= allText.includes('scripts/claude-bridge.mjs') && allText.includes('Check the Edynora') === false && allText.includes('Write a JSON request file');
  resultObserved ||= allText.includes('template-v1') && allText.includes('publishing');
  const useTool = messageCalls === 1;
  const content = useTool ? [{ type: 'tool_use', id: 'toolu_edynora_fixture', name: 'Bash', input: { command, description: 'Verify local Edynora adapter fixture' } }] : [{ type: 'text', text: 'EDYNORA_LOCAL_ADAPTER_VERIFIED' }];
  const message = { id: `msg_fixture_${messageCalls}`, type: 'message', role: 'assistant', model: body.model, content, stop_reason: useTool ? 'tool_use' : 'end_turn', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } };
  if (!body.stream) { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify(message)); }
  res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
  const emit = (type, data) => res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`);
  emit('message_start', { message: { ...message, content: [], stop_reason: null } });
  if (useTool) {
    emit('content_block_start', { index: 0, content_block: { ...content[0], input: {} } });
    emit('content_block_delta', { index: 0, delta: { type: 'input_json_delta', partial_json: JSON.stringify(content[0].input) } });
  } else {
    emit('content_block_start', { index: 0, content_block: { type: 'text', text: '' } });
    emit('content_block_delta', { index: 0, delta: { type: 'text_delta', text: content[0].text } });
  }
  emit('content_block_stop', { index: 0 });
  emit('message_delta', { delta: { stop_reason: message.stop_reason, stop_sequence: null }, usage: { output_tokens: 1 } });
  emit('message_stop', {}); res.end();
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const env = { ...process.env, CLAUDE_CONFIG_DIR: config, ANTHROPIC_API_KEY: 'local-fixture-not-a-secret', ANTHROPIC_AUTH_TOKEN: '', CLAUDE_CODE_OAUTH_TOKEN: '', ANTHROPIC_BASE_URL: `http://127.0.0.1:${server.address().port}`, DISABLE_AUTOUPDATER: '1', DISABLE_TELEMETRY: '1', DISABLE_ERROR_REPORTING: '1', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1' };
const args = ['--print', '/edynora-marketing-agent:status', '--plugin-dir', root, '--output-format', 'json', '--model', 'claude-sonnet-4-5', '--no-session-persistence', '--setting-sources', '', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--permission-mode', 'dontAsk', '--tools', 'Bash', '--allowedTools', 'Bash(node *)', '--max-turns', '3'];
const child = spawn(process.env.CLAUDE_BIN ?? 'claude', args, { env, cwd: config, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
let stdout = '', stderr = ''; child.stdout.on('data', d => stdout += d); child.stderr.on('data', d => stderr += d);
const timer = setTimeout(() => child.kill(), 55000);
try {
  const code = await new Promise((r, reject) => { child.on('error', reject); child.on('close', r); });
  const passed = code === 0 && expandedCommand && resultObserved && stdout.includes('EDYNORA_LOCAL_ADAPTER_VERIFIED');
  const result = { passed, code, messageCalls, expandedCommand, resultObserved, paidRequests: 0, transport: 'loopback deterministic Anthropic mock', liveModelTested: false, ...(passed ? {} : { stdout, stderr }) };
  await writeFile(join(root, 'docs/claude-session-evidence.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2)); if (!passed) process.exitCode = 1;
} finally { clearTimeout(timer); server.closeAllConnections(); await new Promise(r => server.close(r)); }
