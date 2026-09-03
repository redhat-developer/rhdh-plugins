---
'@red-hat-developer-hub/backstage-plugin-ogx-entity-provider': minor
---

Add per-provider TLS connection settings (`caData` and `skipTLSVerify`) to `OgxEntityProviderConfig` so `OgxModelEntityProvider` can fetch `/v1/models` from OGX endpoints that use a private CA or self-signed certificates.
