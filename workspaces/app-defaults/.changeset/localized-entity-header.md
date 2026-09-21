---
'@red-hat-developer-hub/backstage-plugin-app-react': minor
'@red-hat-developer-hub/backstage-plugin-app-defaults': minor
---

Add a localized catalog entity header layout.

`app-defaults` now ships `catalogModule`, a catalog plugin module that replaces the entity page header layout with `LocalizedEntityHeaderLayout`, translating the catalog tab and group titles. Titles are looked up dynamically by their English label under the `catalog.entityTabs.*` and `catalog.entityTabGroups.*` keys, so localizing a new title only requires a translation entry.

`app-react` now provides:

- `appReactTranslationRef` / `appReactTranslations` — the translation ref and resource for the catalog entity tab and group titles (de, es, fr, it, ja).
- `EntityHeaderBui` and `EntityContextMenu` (with the `EntityContextMenuItemDataWithNode` type), exported from the new `@red-hat-developer-hub/backstage-plugin-app-react/alpha` entry point.

**BREAKING**: the `app-defaults` translation ref export was renamed from `translationRef` to `appDefaultsTranslationRef`.
