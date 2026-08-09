---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-model-catalog': minor
'@red-hat-developer-hub/backstage-plugin-catalog-techdoc-url-reader-backend': minor
---

K8s credentials (url, serviceAccountToken, skipTLSVerify, caData) are now configurable via app-config.yaml, either directly or via kubernetesPluginRef. The `baseUrl` config field has been removed from model-catalog; the connector base URL is now resolved via Backstage's DiscoveryService.
