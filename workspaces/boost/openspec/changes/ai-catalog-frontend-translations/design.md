# Design: AI Catalog frontend translations

## Context

English messages live in `plugins/boost/src/translations/ref.ts`.
`boostTranslations` currently registers `translations: {}`.
`boostTranslationsModule` is already a separate package export.

## Decisions

- Follow the rhdh-plugins locale pattern: `createTranslationMessages` with
  flattened dot-notation keys and lazy `import('./de')` (etc.).
- Do not add a lifecycle label to `ref.ts` for the sample filter; that module
  uses a hardcoded English label.

## Non-Goals

- Changing browse or entity-card behavior
- Dynamic plugin export (already in overlays)
