---
'@red-hat-developer-hub/install-dynamic-plugins': minor
---

Initial release. TypeScript/Node.js port of the RHDH init-container installer (originally Python; see [redhat-developer/rhdh#4574](https://github.com/redhat-developer/rhdh/pull/4574)). Ships as a single bundled `.cjs` with `tar` and `yaml` baked in; relies on `skopeo` and `npm` at runtime. CLI surface, env vars, on-disk layout, `plugin-hash` format, and tar/OCI security guards are byte-compatible with the previous Python implementation, so existing RHDH installs upgrade in place without forcing reinstalls.
