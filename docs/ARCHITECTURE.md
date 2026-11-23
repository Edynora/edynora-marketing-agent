# Architecture

```text
PowerShell / shell → CLI parser ────────────────┐
Claude Code skill → JSON request → adapter ────┤
                                              ↓
                          Core Engine → domain modules
                                              ↓
                          Zod contracts → locked JSON Store
                                              ↓
                          approved exports (local files only)
```

`packages/shared/schemas.ts` defines strict runtime contracts; generated JSON Schema lives in schemas/. `store.ts` bounds regular-file reads, rejects symlink components, locks mutation via exclusive `.lock`, validates complete state and atomically replaces state.json. The lock records a PID and timestamp. `content` extracts text through remark and formats source excerpts without executing content. `strategy` and `campaigns` create original deterministic planning templates. `quality` inspects content and source context. `exporters` escapes CSV and Markdown. `core` coordinates these modules without depending on a UI or provider.

Storage contains brands, original sources, items, revision snapshots and event history. Content moves `draft → review-required → approved → exported`. Edits create a new revision and clear approval; brand edits also invalidate related items. Export checks revision and brand version. Approval identity is user-supplied, not authenticated. Local users with direct filesystem write access can alter data; use OS access controls. Source contract approval is retained only as external metadata.

Atomic replacement protects individual files. Export file creation and state persistence are not one cross-file transaction: a crash between them can leave an export file without its history event. State approval validation precedes file creation. Exports do not grant publication authority to any external service. There is no scheduler or email client.

The future ModelProvider interface returns unknown data deliberately: a future implementation must validate responses, bind attribution, disclose provider use/cost, isolate instructions from source content, and reset approval. No model provider is wired into the engine in this release. PublishingAdapter contains only capability metadata and has no publishing method implementation. No n8n, Make, Zapier, social, email or Codex integration is functional.

Bounds: 1 MiB source files, 2.1 MB structured imports (bounded individual fields), 32 MiB workspace state. A single source drives each generation request; multiple-source research, URL fetching, embeddings and autonomous agents are outside v0.1. Known template limitations include excerpt truncation and repeated calendar drafts; inspect original context before approval.
