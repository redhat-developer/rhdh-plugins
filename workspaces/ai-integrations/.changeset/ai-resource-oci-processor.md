---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-catalog-backend-module-ai-resource-extensions': minor
---

Add `AIResourceOciProcessor`, a catalog processor that validates
`spec.location.target` format for OCI-backed `AIResource` entities during
ingestion. Validation is format-only (no outbound registry calls) and rejects
malformed `oci://` URIs with actionable errors.
