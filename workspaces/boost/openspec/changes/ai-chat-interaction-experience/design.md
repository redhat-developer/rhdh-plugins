# Design: AI Chat & Interaction Experience

## Context

Boost builds the frontend as composable extensions from the start. The chat, admin, and agent studio are independently mountable routable extensions with lazy loading at extension boundaries. Sub-route refs are defined in `routes.ts` from day one.

## Goals

- Composable routable extensions for chat, admin, and agent studio
- Lazy loading via `React.lazy()` in `ChatView.tsx` and `AdminLayout.tsx`
- Config-driven feature flags via `app-config.yaml`
- Register with Backstage `featureFlagsApiRef`

## Non-Goals

- Changing the streaming protocol or event processing
- Modifying HITL approval flow behavior
- Changing conversation persistence schema
- Session caches (covered in platform-operations-deployment change)

## Decisions

### Decision 1: Composable extensions wrap lazy-loaded components

Each routable extension uses `React.lazy()` in its `component` factory. This means code-splitting happens at the extension boundary — deployers who mount only `BoostChatPage` never download admin panel code.

### Decision 2: Feature flags use both Backstage API and app-config

Two mechanisms work together:

- `app-config.yaml` `boost.features.*` keys provide deployer-controlled defaults
- Backstage `featureFlagsApiRef` allows runtime user-level overrides via Settings UI
- The `useFeatureFlags` hook checks app-config first, then `featureFlagsApiRef` for overrides

### Decision 3: Default page preserved as composition root

A default `BoostPage` serves as the all-in-one composition root. New extensions are additive — deployers can mount individual extensions or use the default page that composes them all.

## Risks

- **Extension boundary state sharing:** Chat and admin extensions share context. Mitigated by lifting shared state to a context provider registered at the plugin level, not the page level.
- **Lazy loading SSR incompatibility:** Not a concern — RHDH is SPA-only.
