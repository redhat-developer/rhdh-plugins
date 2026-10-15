---
'@red-hat-developer-hub/backstage-plugin-skill-image-connector-backend': minor
---

Harden OCI skill acquisition and extraction bounds: add connection-level DNS validation with pinned Undici dispatchers for registry, discovery, and token requests, initial URL validation, explicit redirect-origin allowlisting, per-image work budget, source operation deadline, 5-redirect cap, 1000-candidate limit, hardened tar parsing, and new configuration options.
