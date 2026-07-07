# RHIDP-14651: Add persona-support in NFS homepage components

**Jira:** [RHIDP-14651](https://redhat.atlassian.net/browse/RHIDP-14651)
**Epic:** [RHIDP-14103](https://redhat.atlassian.net/browse/RHIDP-14103) — Homepage-backend upgrade to GA support
**Feature:** [RHDHPLAN-1371](https://redhat.atlassian.net/browse/RHDHPLAN-1371) — Upgrade homepage related plugins to GA support

## Context

The OFS (Old Frontend System) `HomePage` already calls the `homepage-backend` via `useDefaultWidgets()` to load persona-based (user/group/permission-filtered) default widgets. The NFS (New Frontend System) `HomePageLayout` does **not** — it only renders widgets from extension config, with no backend integration.

The `defaultWidgetsApi` is already registered as an `ApiBlueprint` in NFS (`alpha/extensions/apis.ts`) but never consumed. The existing `useDefaultWidgets` hook uses `useApi` from `@backstage/core-plugin-api`, which is already a re-export of `@backstage/frontend-plugin-api` at runtime — so the same hook can serve both systems without duplication.

The NFS layout extension currently has a `widgetLayout` config schema that provides static layout overrides per widget. This will be removed in favor of the backend-driven defaults which provide the same layout data with persona filtering.

## Changes

### 1. Update `useDefaultWidgets` hook — shared between OFS and NFS

**File:** `plugins/homepage/src/hooks/useDefaultWidgets.ts`

Change `import { useApi } from '@backstage/core-plugin-api'` to `import { useApi } from '@backstage/frontend-plugin-api'`. This is a no-op at runtime (core-plugin-api already re-exports it) but makes the hook explicitly compatible with both frontend systems. No other changes needed — the hook already returns `{ defaultWidgets, loading, error }`.

### 2. Update `HomePageLayout` to integrate backend defaults

**File:** `plugins/homepage/src/alpha/components/HomePageLayout.tsx`

- Import and call `useDefaultWidgets()` from `../../hooks/useDefaultWidgets`
- Show `<Progress />` while loading
- When `defaultWidgets` is returned:
  - Match backend defaults (`defaultWidget.ref`) to NFS widgets (`widget.name`)
  - Apply backend-provided `layout` as `breakpointLayouts` overrides on matched widgets
  - Filter the widget list: only show widgets that have a matching backend default (persona-filtered)
  - Apply backend-provided `props` as component prop overrides
- When backend is unavailable (error or no response):
  - Fall back to current behavior — render all extension-provided widgets as-is

The merge logic follows the pattern in `DefaultWidgetsCustomizableGrid.tsx` and `DefaultWidgetsReadOnlyGrid.tsx` (OFS), adapted for the NFS `HomePageCardConfig` shape.

### 3. Remove `widgetLayout` config from `homePageLayoutExtension`

**File:** `plugins/homepage/src/alpha/extensions/homePageLayoutExtension.tsx`

- Remove the `widgetLayout` config schema entry and all code that reads/applies it (priority sorting, breakpoint mapping)
- Keep the `customizable` config option
- Layout data now comes from backend defaults instead of static extension config

### 4. Update `app-config.yaml` — remove NFS `widgetLayout` config

**File:** `app-config.yaml`

Remove the `widgetLayout` block under `home-page-layout:home/dynamic-homepage-layout` config since it's no longer supported. The `customizable` option stays.

### 5. Rename NFS widget blueprint names to match config `ref` values

The backend config `ref` values must match the NFS widget blueprint `name` values exactly. Rename the NFS widget names to match the existing config refs (preserving backwards compatibility with existing configurations):

**File:** `plugins/homepage/src/alpha/extensions/homePageCards.tsx`

| Config `ref`                    | Current NFS `name`                    | New NFS `name`             |
| ------------------------------- | ------------------------------------- | -------------------------- |
| `quickaccess-card`              | `quick-access-card`                   | `quickaccess-card`         |
| `recently-visited-card`         | `recently-visited`                    | `recently-visited-card`    |
| `top-visited-card`              | `top-visited`                         | `top-visited-card`         |
| `catalog-starred-entities-card` | (override of `home/starred-entities`) | Add explicit name override |

The `rhdh-onboarding-section`, `rhdh-entity-section`, `rhdh-template-section`, and `featured-docs-card` already match.

### 6. Update Playwright e2e tests

**File:** `e2e-tests/homepageCustomizable.test.ts`

- Remove the `test.skip()` for NFS mode in the "Groups filters default widgets by persona" test
- Update the login URL logic: NFS uses `'/'` instead of `'/customizable'` — the persona test currently hardcodes `'/customizable'`
- The test should now pass for both `APP_MODE=legacy` and `APP_MODE=nfs`

### 7. Update unit tests

**File:** `plugins/homepage/src/alpha/alpha.test.ts` — update to reflect removed `widgetLayout` config

Add new test for `HomePageLayout` with mocked `useDefaultWidgets`:

- Backend returns defaults → layout renders persona-filtered widgets
- Backend returns empty → empty state
- Backend unavailable → falls back to extension widgets

## Files to Change

| File                                               | Change                                            |
| -------------------------------------------------- | ------------------------------------------------- |
| `src/hooks/useDefaultWidgets.ts`                   | Switch import to `@backstage/frontend-plugin-api` |
| `src/alpha/components/HomePageLayout.tsx`          | Integrate backend defaults                        |
| `src/alpha/extensions/homePageLayoutExtension.tsx` | Remove `widgetLayout` config                      |
| `src/alpha/extensions/homePageCards.tsx`           | Rename widget names to match config refs          |
| `app-config.yaml`                                  | Remove `widgetLayout` block                       |
| `src/alpha/alpha.test.ts`                          | Update module tests                               |
| `src/alpha/components/HomePageLayout.test.tsx`     | **New** — integration tests                       |
| `e2e-tests/homepageCustomizable.test.ts`           | Enable persona test for NFS                       |

## Out of Scope

- Changes to the backend (`homepage-backend`) — persona filtering already works
- Changes to `homepage-common` types — existing types are sufficient
- OFS changes — OFS already has full persona support (only the `useApi` import changes)

## Verification

1. Run unit tests: `cd workspaces/homepage && yarn test`
2. Run Playwright tests for both modes:
   - `yarn test:e2e:legacy` — verify no regressions
   - `yarn test:e2e:nfs` — verify persona test now passes
3. Manual verification: start the NFS app (`yarn start`) and check:
   - Guest sees common defaults only (no Featured Docs, no Recently Visited)
   - Different users see different widgets based on group membership
