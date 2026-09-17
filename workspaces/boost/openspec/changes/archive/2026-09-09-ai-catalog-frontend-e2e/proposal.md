# Proposal: AI Catalog frontend E2E

> **Status:** Implemented by PR #4501 and archived as test infrastructure.

## Why

The AI Catalog needs browser-level coverage in addition to component tests.

## What Changes

- Add Playwright for the NFS dev app under `e2e-tests/`.
- Cover asset rendering, search, type filtering, table view, empty and error
  states, and an axe audit of the empty catalog.

## Impact

- `workspaces/boost/e2e-tests/`
- `workspaces/boost/playwright.config.ts`
- `workspaces/boost/package.json` (`test:e2e`)
