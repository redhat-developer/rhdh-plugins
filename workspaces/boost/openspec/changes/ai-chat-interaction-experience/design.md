# Design: AI Chat & Interaction Experience

## Context

The chat experience is fully functional but the frontend is monolithic. `AugmentPage` is the single routable extension, eagerly loading all 204 admin panel files and all provider-specific components. Sub-route refs already exist in `routes.ts` — the composability plumbing is partially there.

## Goals

- Decompose into composable extensions using existing sub-route refs
- Add lazy loading in `ChatView.tsx` and `AdminLayout.tsx`
- Add config-driven feature flags via `app-config.yaml`
- Register with Backstage `featureFlagsApiRef`

## Non-Goals

- Changing the streaming protocol or event processing
- Modifying HITL approval flow behavior
- Changing conversation persistence schema
- Migrating session caches (covered in platform-operations-deployment change)

## Decisions

### Decision 1: Composable extensions wrap lazy-loaded components

Each new routable extension uses `React.lazy()` in its `component` factory. This means code-splitting happens at the extension boundary — deployers who mount only `AugmentChatPage` never download admin panel code.

### Decision 2: Feature flags use both Backstage API and app-config

Two mechanisms work together:

- `app-config.yaml` `augment.features.*` keys provide deployer-controlled defaults
- Backstage `featureFlagsApiRef` allows runtime user-level overrides via Settings UI
- The `useFeatureFlags` hook checks app-config first, then `featureFlagsApiRef` for overrides

### Decision 3: Existing AugmentPage preserved as composition root

The monolithic `AugmentPage` remains available and unchanged. New extensions are additive. Zero breaking changes for existing deployers.

## Risks

- **Extension boundary state sharing:** Chat and admin extensions share `AugmentContext`. Mitigated by lifting shared state to a context provider registered at the plugin level, not the page level.
- **Lazy loading SSR incompatibility:** Not a concern — RHDH is SPA-only.
