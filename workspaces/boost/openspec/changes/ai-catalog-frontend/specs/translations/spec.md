# Translations

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Add non-English translation files for the AI Catalog plugin, covering all 5 languages supported across rhdh-plugins. The i18n scaffold (TranslationBlueprint, `createTranslationRef`, English `ref.ts`) is already in place from Story 1.

## Requirements

### Requirement: Translation Files for Supported Languages

Each supported language has a complete translation file following the standard rhdh-plugins pattern.

#### Scenario: Translation files exist for all 5 languages

- **GIVEN** the plugin has English strings in `src/translations/ref.ts`
- **WHEN** the translation story is complete
- **THEN** `src/translations/` contains `de.ts`, `es.ts`, `fr.ts`, `it.ts`, `ja.ts`
- **AND** each file uses `createTranslationMessages` referencing the `boostTranslationRef`

#### Scenario: Translation resource registers all locales

- **GIVEN** all 5 locale files exist
- **WHEN** the `createTranslationResource` in `src/translations/index.ts` is configured
- **THEN** it lazy-imports all 5 locales (`de: () => import('./de')`, etc.)
- **AND** each locale is only loaded when the user selects that language

#### Scenario: Translation module auto-discovery for dynamic plugins

- **GIVEN** the plugin is deployed as a dynamic plugin in RHDH
- **WHEN** the translation module needs to be auto-discovered
- **THEN** a separate entry point re-exports `boostTranslationsModule` as default (e.g., `./boost-translations-module` in `package.json` exports)
- **AND** RHDH auto-discovers the module without explicit `features` array registration

### Requirement: Complete String Coverage

Every user-facing string in the plugin is translated.

#### Scenario: All browse page strings translated

- **GIVEN** a user switches their RHDH locale to German
- **WHEN** they navigate to `/ai-catalog`
- **THEN** the page title, search placeholder, filter labels, empty state message, error state message, pagination labels, and sort options are all in German

#### Scenario: All filter strings translated

- **GIVEN** a user is viewing the AI Catalog in Japanese
- **WHEN** the filter sidebar is visible
- **THEN** filter section headings (type, provider, owner, tags), clear-filters action text, and "has active filters" indicators are in Japanese

#### Scenario: All entity extension strings translated

- **GIVEN** a user views an AI asset entity page in French
- **WHEN** entity cards and tabs from the boost plugin render
- **THEN** card titles (summary, download/adopt, version list), tab labels (usage), download button text, copy button text, docker/podman labels, and "Contact owner" fallback text are all in French

#### Scenario: Error and empty state strings translated

- **GIVEN** a user is viewing the AI Catalog in Spanish
- **WHEN** no assets match the current filters
- **THEN** the empty state message and clear-filters button text are in Spanish
- **WHEN** the catalog API is unreachable
- **THEN** the error message and retry button text are in Spanish

### Requirement: Translation Quality

Translations are accurate and consistent with RHDH conventions.

#### Scenario: Translation keys use dot-notation

- **GIVEN** the English source in `ref.ts` uses nested objects for message keys
- **WHEN** locale files are created
- **THEN** they use flattened dot-notation keys (e.g., `'catalog.filter.type': 'Typ'`)
- **AND** keys match the structure in `ref.ts` exactly

#### Scenario: Placeholder interpolation preserved

- **GIVEN** an English string contains interpolation placeholders (e.g., `{{count}} assets`)
- **WHEN** the string is translated
- **THEN** the same placeholders appear in the translated string
- **AND** the interpolation works correctly at runtime

### Requirement: Verification

Translations render correctly in the dev app.

#### Scenario: Locale switching in dev app

- **GIVEN** the dev app is running
- **WHEN** a developer switches the locale via RHDH Settings
- **THEN** all AI Catalog strings update to the selected language without a page reload

#### Scenario: Fallback to English for missing keys

- **GIVEN** a translation file is missing a key that exists in `ref.ts`
- **WHEN** the UI renders that string
- **THEN** the English fallback is shown (not a raw key or empty string)
