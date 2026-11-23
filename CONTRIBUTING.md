# Contributing

Use Node >=22.12, `npm ci --ignore-scripts`, `npm run check`, and `npm test`. Add deterministic fixtures and regression tests for behavior changes. Mock model responses and never add a test that incurs paid API charges. Run `npm run schemas` after contract changes and `npm run licenses` after dependency changes. Review `npm audit`, the lockfile and actual license texts, including bundled notices.

Keep provider logic separate from the engine. Treat imports and model output as untrusted data; never execute them. Content changes must invalidate approval. Preserve original sources, revision history and attribution. Do not add external publication, email sending or telemetry without an explicit reviewed design and user authorization.

Pull requests should state concrete behavior, tests executed, licensing changes and known limits. Do not include private workspaces, credentials, `.env` files, generated work/ fixtures or node_modules. Original contributions are offered under Apache-2.0; contributors retain their copyrights. The owner confirmed the original attribution as Copyright 2026 Edynora.
