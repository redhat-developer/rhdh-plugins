# @red-hat-developer-hub/backstage-plugin-translations

## 0.4.0

### Minor Changes

- 838a80d: Add NFS (New Frontend System) support and graduate to stable. NFS extensions include PageBlueprint, ApiBlueprint, TranslationBlueprint, and AppRootWrapperBlueprint. OFS exports are now available at `./legacy`.
- 6456930: Add pseudo-localization support using `i18next-pseudo` to help identify untranslated or hardcoded strings in the UI. Strings are transformed with diacritical marks and brackets (e.g., `"Settings"` → `"[Ṣḛḛţţḭḭṇḡṡ]"`). Activate via `?pseudolocalization=true` URL parameter or `i18n.pseudolocalization.enabled: true` in app-config. Includes a `PseudoLocalizationProvider` component for use as a dynamic plugin at the `application/provider` mount point.
- 772a1a6: Backstage version bump to v1.52.1

## 0.3.1

### Patch Changes

- 5148408: Migrated to Jest 30 as required by @backstage/cli 0.36.0.

## 0.3.0

### Minor Changes

- 36f1834: Backstage version bump to v1.49.3

## 0.2.2

### Patch Changes

- f6d5102: Translation added for German and Spanish

## 0.2.1

### Patch Changes

- f74564d: Added 'it' and 'ja' i18n translation support and updated 'fr' translations.

## 0.2.0

### Minor Changes

- a698bf0: Backstage version bump to v1.45.3

## 0.1.0

### Minor Changes

- 2e97aed: Backstage version bump to v1.44.2

## 0.0.3

### Patch Changes

- dd5350f: French translation updated

## 0.0.2

### Patch Changes

- a8787b0: Create an initial version of translations backend plugin
  Add Download keys translations support in frontend plugin
  Upgraded backstage to 1.42.5

## 0.0.1

### Patch Changes

- 788bb05: Create an initial version of the translation plugin
