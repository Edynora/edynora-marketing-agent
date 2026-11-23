# Security and privacy

This is a single-user local tool. There is no server, authentication, encryption at rest, publishing integration, paid API client or telemetry. Keep workspace files in a trusted directory with restrictive OS permissions. Explicit list/show/export responses contain the requested private data; avoid shared terminal logs.

Controls: strict Zod validation; bounded regular-file imports; no eval, dynamic shell execution, network fetches or interpreted content; symlink/junction rejection; safe export filenames; exclusive mutation locks; atomic individual-file replacement; source digests; revision-bound approval; edit/brand invalidation; CSV formula protection and escaped Markdown. Markdown HTML/code/image payloads are excluded from extracted text and never executed. JSON exports remain data and need safe downstream rendering.

These controls do not protect against a malicious local user or administrator who can modify the workspace or race filesystem operations. Approval identities are not authenticated; history is not signed or tamper-proof. Atomic writes do not make export file plus state a cross-file transaction. A crash can leave an orphaned export or stale lock. Back up important sources and history.

Prompt-injection posture: no model provider runs in v0.1, so imported text is inert. Instruction-like content is flagged heuristically but may still appear verbatim in starter drafts. Inspect and remove it. Claude adapter instructions prohibit following imported instructions and require explicit user approval; model behavior is not a mathematical security boundary. Never store credentials in brand profiles or source material.

Dependency security: lock exact versions, disable lifecycle scripts during installation, run npm audit, inspect license reports, and review updates. An audit with no known advisories does not prove absence of vulnerabilities. Do not put passwords or API tokens in CLI arguments or committed files; no API secret configuration is needed in this version.

Report vulnerabilities privately to the repository owner's security reporting channel when configured. No verified security mailbox or public repository URL was provided; do not send private reports to an assumed address. Until publication, contact your known Edynora project owner directly. Public release should configure GitHub private vulnerability reporting.
