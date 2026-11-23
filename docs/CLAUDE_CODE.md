# Claude Code adapter

The plugin contains `/edynora-marketing-agent:marketing` and `/edynora-marketing-agent:status`. The marketing skill is explicitly user-invoked; it delegates through a JSON request bridge to the same core engine used by the standalone CLI. No hooks or background publishing run on installation.

The implementation follows the [official manifest reference](https://code.claude.com/docs/en/plugins-reference): `.claude-plugin/plugin.json` contains metadata; skills and commands live at the plugin root; `${CLAUDE_PLUGIN_ROOT}` is substituted in Markdown content. Validation on the installed version is authoritative.

## Local development loading

```powershell
npm.cmd ci --ignore-scripts
npm.cmd run build
claude plugin validate . --strict --json
claude --plugin-dir .
```

Then explicitly invoke `/edynora-marketing-agent:status` or `/edynora-marketing-agent:marketing`. A Claude session requires your existing subscription or configured model access, may consume usage, and is not required by the offline CLI. The alpha's live acceptance used the owner's existing Pro subscription with API credentials removed for that child process; no paid API-key calls were made.

## Local marketplace installation

Build/install dependencies first. Register/install from the local repository:

```powershell
claude plugin install edynora-marketing-agent --marketplace 'C:\path\to\edynora-marketing-agent' --scope user
claude plugin list --json
```

The included marketplace points at the repository root. Build the source checkout first. The npm tarball includes dist/ and bundled production dependencies, so its installed package folder is also a portable plugin directory. Claude Code 2.1.327's tested local marketplace install reads the prepared local source folder directly. Other distribution methods may cache it; a cached copy must retain dist/ and production dependencies. No automatic dependency-install hook is included.

The bridge invocation itself is independently testable without a model:

```json
{"workspace":"C:/path/to/marketing-data","args":["doctor"]}
```

Save as request.json and run `node scripts/claude-bridge.mjs request.json`. For other operations use the CLI reference's command arguments as a string array. The bridge parses the JSON and dispatches directly; it does not interpolate arguments into a shell.

After `npm pack --ignore-scripts`, `npm run test:plugin` extracts the prepared distribution and validates/installs it in a disposable `CLAUDE_CONFIG_DIR` in the parent workspace's work/ directory, then lists the installed plugin, executes its bridge and records evidence. This avoids relying on an uncommitted Git checkout. It requires the OS `tar` utility. This does not modify your real Claude plugin configuration.

`npm run test:claude-session` runs actual Claude Code command loading and a tool execution loop against an ephemeral loopback-only deterministic mock of the Anthropic API. It verifies command expansion, bridge execution and the resulting tool output with zero paid requests. This confirms adapter behavior under a controlled response; it does not verify live model judgment or a paid provider. See FINAL_REPORT.md and the JSON evidence files for results.

`npm run test:subscription` is an opt-in live synthetic acceptance test. It requires an existing Claude subscription login, removes API/provider credentials from its child process, verifies `authMethod: claude.ai`, and refuses API-key fallback. It consumes subscription allowance. It verifies template drafting, quality inspection, blocked unapproved export, editing, synthetic fixture approval/export and post-approval invalidation. It never approves real marketing, publishes or sends anything. Raw session logs remain in the ignored parent work/ directory; only a non-secret summary is saved in docs/claude-subscription-evidence.json. See ALPHA_READINESS.md for the actual executed outcome.
