---
description: Check the Edynora local engine without generating or publishing content
---

Write a JSON request file in the user project with `{"workspace":"ABSOLUTE_WORKSPACE_PATH","args":["doctor"]}`. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/claude-bridge.mjs" "ABSOLUTE_REQUEST_FILE_PATH"` using appropriately quoted paths. Report the JSON response. Do not install packages, access remote services or publish. Read `${CLAUDE_PLUGIN_ROOT}/docs/CLI_REFERENCE.md` if necessary.
