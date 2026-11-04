---
'@red-hat-developer-hub/backstage-plugin-npx-skill-connector-backend': minor
---

Add artifact retrieval, SHA-256 verification, and metadata normalization for npx skill-md entries. Discovered entries are fetched through the configured safe transport, verified against their index digest before decoding, and normalized using the shared D3 metadata normalizer. Snapshots are now published with scheduled refresh instead of remaining in loading state.
