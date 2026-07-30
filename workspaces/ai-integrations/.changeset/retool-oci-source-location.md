---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-catalog-backend-module-ai-resource-extensions': minor
---

Migrate OCI asset location validation from `spec.location` to the standard
`backstage.io/source-location` annotation using the Backstage location-ref
form `url:oci://...`. The annotation is parsed with upstream `parseLocationRef`
for correct whitespace handling. Bare `oci://...` annotations (without the
`url:` prefix) are rejected with an actionable error.
