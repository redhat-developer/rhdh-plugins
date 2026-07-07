# RHIDP-14651: Add persona-support in the NFS components

**Jira:** [RHIDP-14651](https://redhat.atlassian.net/browse/RHIDP-14651)
**Epic:** [RHIDP-14103](https://redhat.atlassian.net/browse/RHIDP-14103) — Homepage-backend upgrade to GA support
**Feature:** [RHDHPLAN-1371](https://redhat.atlassian.net/browse/RHDHPLAN-1371) — Upgrade homepage related plugins to GA support

## Problem

The OFS (Old Frontend System) `HomePage` component already calls the `homepage-backend` via `useDefaultWidgets()` to load persona-based (user/group/permission-filtered) default widgets. The NFS (New Frontend System) `HomePageLayout` does **not** — it only renders whatever widgets the upstream home plugin passes in, with no backend-driven defaults.

This means RHDH customers using NFS cannot configure persona-based homepages (e.g., different widgets for engineers vs. managers).

## Current Architecture

### OFS flow (already working)

```
HomePage
  → useDefaultWidgets() hook
    → DefaultWidgetsApiClient.getDefaultWidgets()
      → GET /api/homepage/default-widgets (backend, with user credentials)
  → if defaultWidgets returned:
      → DefaultWidgetsCustomizableGrid or DefaultWidgetsReadOnlyGrid
    else:
      → CustomizableGrid or ReadOnlyGrid (mount-point-only fallback)
```

### NFS flow (current — no backend integration)

```
homePageLayoutExtension (HomePageLayoutBlueprint)
  → receives `widgets` from upstream home plugin
  → HomePageLayout
    → CustomizableGridLayout or ReadOnlyGridLayout
    → widgets come only from extension config (widgetLayout), not backend
```

### NFS API registration (already exists)

The `defaultWidgetsApi` is already registered in `alpha/extensions/apis.ts` as an `ApiBlueprint`, so the API client is available in the NFS dependency injection. It is just never consumed by the layout.

## Implementation Plan

### 1. Add `useDefaultWidgets` hook for NFS

Create a new hook (or adapt the existing OFS one) that works with the NFS `useApi` from `@backstage/frontend-plugin-api` instead of `@backstage/core-plugin-api`:

- File: `src/alpha/hooks/useDefaultWidgets.ts`
- Uses the `defaultWidgetsApiRef` already registered
- Returns `{ defaultWidgets, loading, error }` — same shape as the OFS hook

### 2. Update `HomePageLayout` to integrate backend defaults

Modify `src/alpha/components/HomePageLayout.tsx`:

- Call `useDefaultWidgets()` to fetch persona-based default widgets from the backend
- Show `<Progress />` while loading
- When `defaultWidgets` is returned from backend:
  - Merge backend defaults with the extension-provided `widgets` (backend defaults provide layout/props overrides; extension widgets provide the actual React components)
  - Render using existing grid components
- When backend returns no defaults (or backend is unavailable):
  - Fall back to the current behavior (extension-only widgets)

### 3. Add/update unit tests

- `src/alpha/hooks/useDefaultWidgets.test.ts` — test the NFS hook
- `src/alpha/components/HomePageLayout.test.tsx` — test the integration:
  - Backend returns defaults → renders with persona-based config
  - Backend returns empty → falls back to extension widgets
  - Backend unavailable → falls back gracefully

### 4. Update example app (NFS)

Ensure `packages/app/` is configured to demonstrate the NFS homepage with the backend plugin enabled, so the persona flow can be tested end-to-end locally.

### 5. Documentation

Add a section to the workspace README or a dedicated doc file describing:

- How to configure persona-based defaults for NFS
- Configuration example (same YAML format as OFS, via `homepage.defaultWidgets`)
- Differences/parity between OFS and NFS behavior

## Key Design Decision

**Merging strategy:** The backend returns `VisibleDefaultWidget[]` which contains `id`, `ref`, `props`, and `layout`. The NFS receives `HomePageCardConfig[]` (widgets) from the upstream home plugin. The merge needs to:

1. Match backend defaults by `ref` → NFS widget by `name`
2. Apply backend-provided `layout` as `breakpointLayouts` overrides
3. Apply backend-provided `props` as component prop overrides
4. Respect backend ordering/filtering (persona-based visibility is already handled server-side)

This mirrors how `DefaultWidgetsCustomizableGrid` and `DefaultWidgetsReadOnlyGrid` work in OFS — matching `defaultWidget.ref` to `mountPoint.config.id`.

## Files to Change

| File                                               | Change                             |
| -------------------------------------------------- | ---------------------------------- |
| `src/alpha/hooks/useDefaultWidgets.ts`             | **New** — NFS-compatible hook      |
| `src/alpha/components/HomePageLayout.tsx`          | Integrate backend defaults         |
| `src/alpha/extensions/homePageLayoutExtension.tsx` | Pass through API context if needed |
| `src/alpha/alpha.test.ts`                          | Update module tests                |
| `src/alpha/hooks/useDefaultWidgets.test.ts`        | **New** — hook tests               |
| `src/alpha/components/HomePageLayout.test.tsx`     | **New** — integration tests        |
| `packages/app/`                                    | Update example app config          |

## Out of Scope

- Changes to the backend (`homepage-backend`) — persona filtering already works
- Changes to `homepage-common` types — existing types are sufficient
- OFS changes — OFS already has full persona support
