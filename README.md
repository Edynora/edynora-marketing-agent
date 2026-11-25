# Edynora Marketing Agent

> **Official repository: [EdynoraHQ/edynora-marketing-agent](https://github.com/EdynoraHQ/edynora-marketing-agent)**
>
> This personal-account repository is retained as a historical copy. Use the official organization repository linked above for current code, documentation, issues, and releases.


**AI Workflows. Intelligent Automation. Smarter Work.**

**0.1.0-alpha.1 — early alpha.** Uses offline templates, with a live-tested Claude Code adapter. See [alpha readiness](docs/ALPHA_READINESS.md) for verification scope and remaining limits.

[![checks](https://github.com/Edynora/edynora-marketing-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/Edynora/edynora-marketing-agent/actions/workflows/ci.yml)

Local-first marketing workflows for creators, entrepreneurs, marketers, consultants, educators and small businesses. Create reusable brand profiles, import source material, produce nine types of attributed drafts, plan calendars and email sequences, review changes, explicitly approve revisions and export files. The CLI works independently of Claude Code.

Version 0.1 uses **offline deterministic extractive templates**, labeled `template-v1`. These are working planning aids and starter drafts, not AI-generated copy. No paid API, subscription, server or marketing account is needed for the core product. There is no email sending, publication or scheduling integration. Calendars are editable plans.

## Install from this repository

Use Node.js 22.12 or newer (Node LTS recommended), npm and a terminal. PowerShell:

```powershell
Set-Location 'PATH\TO\edynora-marketing-agent'
npm ci --ignore-scripts
npm run build
node .\dist\packages\cli\index.js doctor
npm test
```

macOS/Linux use the same commands, with `node ./dist/packages/cli/index.js doctor`. See [installation](docs/INSTALLATION.md) for packed installation and the `edynora` executable. Source and alpha releases are hosted in the [GitHub repository](https://github.com/Edynora/edynora-marketing-agent). npm publication and service deployment are deferred.

## Run your first workflow in PowerShell

```powershell
$cli = '.\dist\packages\cli\index.js'
$workspace = '.\work\my-brand'
$brand = (node $cli --workspace $workspace brand create --file .\examples\edynora.brand.json | ConvertFrom-Json).data
$source = (node $cli --workspace $workspace ingest --file .\examples\workflow.md --kind markdown --title 'Review a workflow' | ConvertFrom-Json).data
$drafts = (node $cli --workspace $workspace repurpose --brand $brand.id --source $source.id --platforms 'linkedin,x,youtube' | ConvertFrom-Json).data
$draft = $drafts[0]
node $cli --workspace $workspace show --type items --id $draft.id
node $cli --workspace $workspace quality --id $draft.id
node $cli --workspace $workspace review --id $draft.id
# Read the draft, source and quality report before explicitly approving:
node $cli --workspace $workspace approve --id $draft.id --version $draft.version --reviewer 'Your name' --note 'Reviewed source, claims, CTA and brand voice'
node $cli --workspace $workspace export --ids $draft.id --format markdown --out approved.md
```

Exports live in `workspace/exports`. Approval is required for content exports. Brand and source-contract data can be exported without content approval. Editing content or its brand resets approval. `npm run demo` executes an explicitly labeled synthetic fixture workflow with demo-only approvals.

## Included workflows

- Brand create, edit, validate, import and export, including audience, voice, offerings, objectives, CTAs, restrictions, channels and frequency.
- Text/Markdown ingestion for transcripts, articles, scripts, descriptions and briefs. Markdown is parsed to text; HTML is never executed. No YouTube fetching, PDF, DOCX or subtitle file parser is included.
- LinkedIn, Facebook, Instagram, X, YouTube descriptions, Shorts scripts, newsletters, blog outlines and promotional email starter drafts.
- Strategy with user-supplied business facts separated from planning assumptions, channel tactics, pillars and suggested indicators.
- Editable 7/30-day calendars with dates, channels, pillars, topics, text, CTAs, assets and statuses. These provide daily draft slots; brand weekly frequency remains a planning input, not an automatic schedule.
- Welcome, newsletter, launch, webinar and follow-up emails with subjects, previews and consent/unsubscribe placeholders.
- Heuristic quality reports and revision history, explicit review and named approval, CSV/JSON/Markdown export with CSV formula protection.
- Proposed versioned Video Workflow data contract and Claude Code skill/command adapter. External Video Workflow compatibility is not verified against another implementation.

## Documentation

[CLI reference](docs/CLI_REFERENCE.md) · [Claude Code plugin](docs/CLAUDE_CODE.md) · [Architecture](docs/ARCHITECTURE.md) · [Shared contract](docs/DATA_CONTRACT.md) · [Research](docs/OPEN_SOURCE_RESEARCH.md) · [Licenses](docs/THIRD_PARTY_LICENSES.md) · [Troubleshooting](docs/TROUBLESHOOTING.md) · [Release notes](docs/RELEASE_NOTES.md) · [Final verification report](docs/FINAL_REPORT.md)

All inputs are untrusted. Sources are preserved and cited, but their claims are not independently verified. Human approval does not guarantee legal compliance. Store workspace files on a trusted, access-controlled local filesystem; this is not encrypted storage or a tamper-proof approval system. See [SECURITY.md](SECURITY.md).

Copyright 2026 Edynora, as confirmed by the project owner. Original code is licensed under Apache-2.0; dependency licenses remain their own.
