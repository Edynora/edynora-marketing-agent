# Edynora Marketing Agent — final development report

Prepared 2026-11-23. Version 0.1.0. Copyright 2026 Edynora, Apache-2.0, as confirmed by the project owner.

## Implemented

Working strict-TypeScript core and independent CLI; validated brand creation, editing, validation and import/export; six source types; original/extracted text and digests; nine attributed platform draft formats; strategy with business inputs separated from assumptions; editable 7/30-day calendars; five email campaign types; heuristic quality reports; immutable revision snapshots and event history; explicit review and version-bound approval; CSV/JSON/Markdown exports; proposed versioned Video Workflow contract; thin Claude Code skill/command and JSON adapter; extension interfaces; examples, schemas, docs and GitHub Actions configuration.

Generation is explicitly **offline deterministic template-v1**, not model-generated content. Core workflows require no paid service. There is no publication, scheduling, email sending or paid API client.

## Executed verification

| Check | Actual result |
| --- | --- |
| `npm ci/install --ignore-scripts` with pinned dependencies | Installed successfully; lifecycle scripts disabled |
| `npm run check` and `npm run build` | Strict TypeScript check and compilation passed |
| `npm test` | **21 tests passed, 2 files**; includes engine workflows, all platforms/email types, real CLI processes, adapter requests, approval invalidation, exports, concurrency, unsafe names, Unicode byte limits and junction rejection |
| `npm run schemas` | Generated brand, video-v1 and workspace-v1 JSON schemas |
| `npm run licenses` | 143 locked package entries, 92 installed on Windows; **no installed-package review flags**; full notices copied |
| `npm audit --json` | **0 known vulnerabilities** across the lockfile graph at verification time |
| Official Claude Code strict validator | Recognized marketing skill and status command; manifest valid. Optional directory listing icon is absent; no claim of marketplace-directory submission readiness |
| `npm run test:plugin` | Claude Code **2.1.327** installed and enabled the local marketplace plugin in disposable configuration; installed adapter bridge also tested |
| `npm run test:claude-session` | **Passed:** actual Claude Code expanded the status command and executed the bridge; tool result observed through a loopback deterministic mock API; **0 paid requests**. Evidence: claude-session-evidence.json |
| `npm run demo` | Created 3 platform drafts, 7 calendar slots and 3 welcome emails; synthetic approvals; exported all 13 records in JSON, CSV and Markdown |
| `npm pack --ignore-scripts` and offline local installation | Packed distribution installed with bundled runtime dependencies; standalone installed executable returned a valid doctor response |
| Independent read-only code review | No important approval, correctness or export-security defect identified in reviewed code; local-user and cross-file transaction limits confirmed |

Test development initially failed on missing modules, then exposed an end-to-end timeout setting and Windows sandbox junction-creation denial. The process test timeout was adjusted to 30 seconds; the junction test passed outside the sandbox. Additional regression tests exposed Unicode character/byte mismatch and unflagged added capability assertions; both were fixed and all 21 tests passed. No skipped test is counted as passing. Plugin installs from the development checkout were inconsistent and timed out under both sandboxed and later unsandboxed runs; the prepared tarball installed successfully in a fresh isolated config and its bridge executed. The install-test script now uses that prepared distribution rather than an uncommitted checkout.

## Dependency and license findings

Runtime: Zod **4.6.7** and remark **15.0.1**, MIT. Development: Vitest **5.1.1** (MIT), TypeScript **7.0.2** (Apache-2.0), @types/node **26.6.6** (MIT). Exact transitive graph is in package-lock.json and docs/dependency-inventory.json. Runtime dependencies are bundled in the npm tarball for portable offline installation.

LangChainJS and Activepieces were researched but not added. Activepieces has mixed community/enterprise licensing; no code was copied. Native Rolldown's binding package omitted a license file; the matching-version parent package's upstream MIT license was preserved explicitly. Absent optional platform packages have lockfile metadata only, and their full license texts were not locally inspected. Preserve and regenerate notices for each release platform. See OPEN_SOURCE_RESEARCH.md and THIRD_PARTY_LICENSES.md.

## Known limits

- The actual Claude Code command/tool loop was tested with a local mocked model. No live paid model/provider behavior or quality was tested. Marketing skill behavior under a live model remains a user-session acceptance step.
- The Video Workflow schema is a proposed contract; no existing separate product contract was supplied, so external interoperability is unverified.
- Windows PowerShell on Node **26.13.1**, npm **11.20.0**, Git **2.55.0** was used locally. The Windows/Linux/macOS, Node 22/24/26 CI matrix is configured but has not run on GitHub.
- Drafts are starter templates and can repeat or truncate context. Calendars are daily editorial slots, not schedules, and do not automatically enforce brand weekly frequency. Email placeholders require editorial/legal/consent review.
- Quality checks are heuristic; added capability/outcome checks use simple phrase matching. They cannot establish truth, legal compliance or full brand voice consistency. Source citations trace origin, not verification.
- Local JSON storage is not encrypted, authenticated, signed or tamper-proof. OS-authorized writers can modify it. Individual writes are atomic; export-file plus state update is not one atomic transaction. See SECURITY.md for scope and crash handling.
- No model provider or external marketing integration is implemented. No GitHub/npm publication, deployment, marketing email or social publishing occurred.

## Install and next steps

From source: `npm ci --ignore-scripts`, `npm run build`, then `node dist/packages/cli/index.js doctor`. Use npm.cmd in PowerShell if npm.ps1 is blocked. The README contains a complete PowerShell walkthrough. The npm tarball can be installed locally with `npm install --ignore-scripts PATH_TO_TARBALL`; it includes compiled code and runtime dependencies. The source ZIP contains the reproducible repository and tests.

Recommended next steps: run a real-user Claude marketing skill acceptance session with authorized model access; execute the CI matrix; compare the proposed video schema with the actual Video Workflow implementation; edit/review real brand-specific campaign drafts; only then consider adding a validated provider and separately authorized external integrations. Public GitHub/npm release requires your explicit approval and has not been performed.
