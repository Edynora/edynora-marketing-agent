# CLI reference

`edynora [--workspace PATH] COMMAND --flag VALUE`. From source replace `edynora` with `node dist/packages/cli/index.js`. No shell or external command is executed by the engine. Flags accept one argument each; quote spaces in PowerShell or your shell. Unknown commands, flags, duplicates and missing required values fail.

Every success writes `{ "ok": true, "data": ... }` to stdout and exits 0. Failure writes `{ "ok": false, "error": { "code": ..., "message": ... } }` to stderr and exits 1. Validation errors include field paths and codes without raw input values. Commands such as `show` intentionally return the requested private data; avoid redirecting them to shared logs.

Workspace selection: explicit `--workspace`, then `EDYNORA_WORKSPACE`, then `.edynora` under current working directory. The selected path is the security boundary. Input paths may point to explicitly chosen files elsewhere; they must be regular files with no symlink components. State and exports reject symlink paths.

| Command | Required options | Result |
| --- | --- | --- |
| `brand create` / `brand import` | `--file profile.json` | Validated profile, new local UUID, version 1 |
| `brand validate` | `--file profile.json` | Valid profile or structured issues |
| `brand edit` | `--id UUID --file patch.json` | Partial profile patch; increments brand version and resets related content approvals |
| `brand export` | `--id UUID --out profile.json` | Profile-only JSON inside workspace/exports; reimportable |
| `ingest` | `--file FILE --kind KIND --title TITLE` | Source ID, original, extracted text, SHA-256 digest |
| `contract import` | `--file video.json` | Validated proposed Video Workflow v1 source; imported approval inert |
| `contract export` | `--id SOURCE_UUID --out video.json` | Contract JSON; metadata preserved for imported contracts |
| `repurpose` | `--brand UUID --source UUID --platforms CSV` | Platform drafts in draft state |
| `strategy` | `--brand UUID` | Strategy response; can redirect stdout into a local file |
| `calendar` | `--brand UUID --source UUID --days 7\|30 --start YYYY-MM-DD` | Daily planning slots, all in draft state |
| `email` | `--brand UUID --source UUID --type TYPE` | Local email sequence |
| `list` | `--type brands\|sources\|items` | Full records in selected collection |
| `show` | `--type brands\|sources\|items --id UUID` | One full record, including history where relevant |
| `edit` | `--id UUID --file patch.json --reason TEXT` | New revision; old snapshots retained, approval cleared |
| `quality` | `--id UUID` | Actionable heuristic findings; does not modify state |
| `review` | `--id UUID` | Review-required state, clears any prior approval |
| `approve` | `--id UUID --version INTEGER --reviewer NAME --note TEXT` | Explicit approval for the reviewed current revision |
| `export` | `--ids UUID,UUID --format json\|csv\|markdown --out FILENAME` | Approved records exported; local event history updated |
| `doctor` | none | Version, workspace, generation method, provider/publishing/telemetry state |

Kinds: `transcript`, `markdown`, `text`, `script`, `product`, `brief`. Platforms: `linkedin`, `facebook`, `instagram`, `x`, `youtube`, `shorts`, `newsletter`, `blog`, `email`. Email types: `welcome` (3), `newsletter` (1), `launch` (3), `webinar` (3), `follow-up` (2).

Editable item fields: `body`, `topic`, `cta`, `date`, `pillar`, `requiredAssets`, `subject`, `previewText`. Metadata, versions, source IDs and approvals cannot be patched. A date patch must be a valid calendar date. Read the current version before approval; stale version numbers fail. Changing a brand invalidates every associated item even if already exported; historical files cannot be recalled.

Export filenames must be simple ASCII names of up to 101 characters, begin with a letter/digit, have no directory separators, reserved Windows device names or trailing dot/space. Existing exports with the same name are atomically replaced. CSV fields include all stored fields, including calendar columns and approval metadata. CSV begins with a UTF-8 BOM and uses CRLF and quoted fields. Potential formulas receive an apostrophe. Markdown escapes user HTML and Markdown syntax. JSON preserves raw text as data; render it safely in downstream tools.

Calendar slots deliberately reuse the selected source excerpt and rotate brand channels and suggested pillars. They need editorial differentiation; repeated content is flagged. Email placeholders must be resolved and consent verified before use. Export approval does not suppress quality warnings; reviewers are responsible for resolving them.
