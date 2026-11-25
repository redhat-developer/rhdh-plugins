---
'@red-hat-developer-hub/backstage-plugin-homepage': patch
---

Safely resolve user identity, query catalog entities, and handle search queries across homepage widgets (OnboardingSection, EntitySection, TemplateSection, FeaturedDocsCard, CatalogStarredEntitiesCard, SearchBar) with fallback or graceful hiding when `catalogApiRef` or `searchApiRef` is unavailable, allowing homepage widgets to render without error when the catalog or search plugins are decoupled or disabled.
