---
'@red-hat-developer-hub/backstage-plugin-app-defaults': patch
---

Move the empty-state action button into `EmptyCatalogGate`. Custom pages now pass an `importButtonTitle` string instead of an `action` element, and the gate renders a single "import" button linking to `/catalog-import`. The catalog graph and TechDocs empty states now use this import button as well (previously linked to `/catalog` and the external docs).
