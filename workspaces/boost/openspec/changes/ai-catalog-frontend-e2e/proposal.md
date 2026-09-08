# Proposal: AI Catalog frontend E2E

> **Workspace status:** Remaining current-release work for `plugins/boost` in
> RHDH 2.1. This change adds verification only; it does not expand product
> scope or add backend integration.

## Why

The browse page needs Playwright coverage for search, filters, pagination,
empty/error states, and accessibility. This work was split out of
`ai-catalog-frontend`.

## What Changes

- Add Playwright for the NFS dev app under `e2e-tests/`
- Cover browse, search, filters, pagination, empty state, and axe audits

## Impact

- `workspaces/boost/e2e-tests/`
- `workspaces/boost/playwright.config.ts`
- `workspaces/boost/package.json` (`test:e2e`)
