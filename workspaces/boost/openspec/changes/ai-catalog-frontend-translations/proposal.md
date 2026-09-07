# Proposal: AI Catalog frontend translations

## Why

English strings are already in `boostTranslationRef`. RHDH plugins also ship
de/es/fr/it/ja locale files. This work was split out of `ai-catalog-frontend`.

## What Changes

- Add locale files `de.ts`, `es.ts`, `fr.ts`, `it.ts`, `ja.ts`
- Register lazy imports in `createTranslationResource`

The translation module entry (`./boost-translations-module`) already exists.

## Impact

- `plugins/boost/src/translations/`
