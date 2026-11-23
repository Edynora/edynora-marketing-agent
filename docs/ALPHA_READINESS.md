# Alpha readiness — 0.1.0-alpha.1

The owner authorized the recommended private-repository → cross-platform CI → live Claude acceptance → public alpha sequence. Source is hosted at https://github.com/Edynora/edynora-marketing-agent. Keep repository visibility private until the acceptance gates pass. No hosted deployment is required for this local CLI/plugin product; npm publication is deferred, enforced by `private: true` in package.json.

## Evidence and gates

- Local alpha verification: strict typecheck and all 21 tests passed after version/packaging changes. The alpha tarball installed offline in a fresh directory, reported the correct version and created a brand successfully.
- Windows/Linux/macOS × Node 22/24/26 CI: the first run exposed macOS's symlinked temporary-directory alias in test fixtures. Fixtures now resolve the OS temporary directory to its canonical path; product symlink rejection remains unchanged. A new matrix run is required. Workflow also checks schemas, licenses, dependency audit, package creation and a clean offline package installation.
- Claude command loading/tool execution: passed against a loopback-only deterministic mock; zero paid calls. This is not evidence of live model behavior.
- Live Claude marketing acceptance: pending. Current authentication uses ANTHROPIC_API_KEY; the owner reconfirmed the no-paid-API limit. A live request must wait for subscription/local-model access; no paid calls are authorized.
- Human approval boundary: live fixture test must demonstrate that unapproved export fails, an edit clears approval, and an explicitly approved synthetic fixture can export. Never approve or publish real user marketing during this acceptance test.
- Public alpha release: gated on successful CI and live acceptance; label it `v0.1.0-alpha.1` and document offline template generation and known limitations.

The original FINAL_REPORT.md is a historical local-build report. This file and the linked GitHub run are authoritative for subsequent release preparation. No live AI generation provider, publisher, email sender, scheduler, or verified external Video Workflow integration is implemented.
