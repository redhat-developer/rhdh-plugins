---
'@red-hat-developer-hub/backstage-plugin-translations': minor
---

Add pseudo-localization support using `i18next-pseudo` to help identify untranslated or hardcoded strings in the UI. Strings are transformed with diacritical marks and brackets (e.g., `"Settings"` → `"[Ṣḛḛţţḭḭṇḡṡ]"`). Activate via `?pseudolocalization=true` URL parameter or `i18n.pseudolocalization.enabled: true` in app-config. Includes a `PseudoLocalizationProvider` component for use as a dynamic plugin at the `application/provider` mount point.
