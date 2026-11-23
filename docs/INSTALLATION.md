# Installation and supported environments

Requirements: Node.js >=22.12, npm, and optionally Git/Claude Code. Prefer an actively supported Node LTS version. No operating-system installation or paid service setup is performed by this repository.

## Windows PowerShell

```powershell
Set-Location 'C:\path\to\edynora-marketing-agent'
npm.cmd ci --ignore-scripts
npm.cmd run build
node .\dist\packages\cli\index.js --help
npm.cmd test
npm.cmd pack --ignore-scripts
```

`npm.cmd` avoids PowerShell execution policy errors with npm.ps1. The lockfile is committed for reproducibility. Dependencies are installed with lifecycle scripts disabled; the current graph builds without their scripts on the tested machine.

To install the packed artifact in another local folder without changing global npm configuration:

```powershell
New-Item -ItemType Directory -Force .\work\consumer | Out-Null
npm.cmd install --prefix .\work\consumer --ignore-scripts .\edynora-marketing-agent-0.1.0-alpha.1.tgz
& .\work\consumer\node_modules\.bin\edynora.cmd doctor
```

Optional user-controlled global install: `npm.cmd install --global --ignore-scripts .\edynora-marketing-agent-0.1.0-alpha.1.tgz`. Run `edynora.cmd doctor` afterward. This is not needed for repository use or for Claude's JSON bridge.

## macOS and Linux

```sh
cd /path/to/edynora-marketing-agent
npm ci --ignore-scripts
npm run build
node ./dist/packages/cli/index.js doctor
npm test
npm pack --ignore-scripts
```

No Bash-specific product scripts are required. Native filesystem mode bits are best-effort; Windows permissions follow the containing directory ACL. Windows Node 26 is tested locally. Node 22/24/26 across Windows/Linux x64 and macOS 26 Intel is defined in CI; see ALPHA_READINESS.md and GitHub Actions for the latest executed status. Apple Silicon runtime behavior is not yet verified. On macOS, choose canonical workspace/input paths: system aliases such as /var or /tmp may be symlinks and are intentionally rejected. `realpath` can resolve an existing alias before use.

## Upgrade and uninstall

Back up your workspace before upgrading. Reinstall from the new lockfile and build. Unknown state schema versions fail rather than silently migrate. Remove only your chosen local installation to uninstall; workspace data remains separate. Do not remove a workspace unless you want to delete its brands, sources, revision history and exports.
