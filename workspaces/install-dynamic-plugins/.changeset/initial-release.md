---
'@red-hat-developer-hub/cli-module-install-dynamic-plugins': minor
---

Initial release. TypeScript/Node.js port of the RHDH init-container installer (originally Python; see [redhat-developer/rhdh#4574](https://github.com/redhat-developer/rhdh/pull/4574)), packaged as a Backstage CLI module (`createCliModule`). Invoke as `install-dynamic-plugins install <dynamic-plugins-root>` standalone, or via `backstage-cli` once discovered. Ships as a single bundled `.cjs` with `tar`, `yaml`, and the cli-module runtime baked in; relies on `skopeo` and `npm` at runtime. Env vars, on-disk layout, `plugin-hash` format, and tar/OCI security guards are byte-compatible with the previous Python implementation.
