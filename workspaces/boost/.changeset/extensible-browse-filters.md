---
'@red-hat-developer-hub/backstage-plugin-boost': minor
---

Add extensible browse filters via NFS AiCatalogFilterBlueprint. Deployers can disable built-in filters and third-party plugins can add new filters to the AI Catalog sidebar via app-config.

**Breaking:** The page extension ID changed from `page:boost` to `page:boost/ai-catalog`. Update any `app.extensions` references in `app-config.yaml` accordingly.
