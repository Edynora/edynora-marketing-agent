# Troubleshooting

- **npm.ps1 execution policy:** use `npm.cmd` in PowerShell. Do not relax machine policy merely for this project.
- **Node version:** run `node --version`; use >=22.12. If native tooling fails, reinstall from the lockfile on the intended platform. Do not copy node_modules between operating systems.
- **Missing dist module:** run `npm run build` in the source checkout, or install the prepared tarball. Plugin cache copies need production dependencies as well as dist/.
- **VALIDATION_ERROR:** inspect field paths in `error.issues` and compare examples/schemas. Raw user input is omitted from error messages. JSON files may have a UTF-8 BOM; malformed JSON fails.
- **WORKSPACE_BUSY:** another writer or a crashed process left `.lock`. Read its PID/timestamp and verify that process is no longer running before removing only that specific lock file. Never delete it while a writer is active.
- **UNSAFE_PATH:** choose a direct local path without symbolic links/junctions, a safe filename and adequate OS access. Workspace symlinks intentionally fail. A test that creates junctions may need a normal terminal outside an app sandbox; do not skip it and report the suite as fully verified.
- **APPROVAL_REQUIRED / STALE_VERSION:** inspect the current item and brand, resolve review findings, request review, explicitly approve the exact version and retry export. Editing invalidates previous approval.
- **Repeated calendar drafts:** each slot is a planning draft drawn from the selected source. Edit individual items and differentiate them before approval.
- **Claims flagged despite source citation:** a source may contain unsupported statements. Attribution traces origin but does not prove the claim.
- **No publishing/sending:** this version cannot connect to marketing platforms or send mail. Export a reviewed file for a separate authorized workflow.
- **Crash during export:** a completed export file can exist without a recorded export event if state persistence failed. Inspect it and the current revision; rerun the export after fixing storage. Do not infer publication from an export file.
- **Unknown schema version:** preserve the original and use an explicitly supported converter when one exists. Do not simply relabel the version.
