# Tasks: AI Chat & Interaction Experience

## 1. Composable Extensions (P1)

- [ ] 1.1 Create `BoostChatPage` routable extension in `plugin.ts` using `chatRouteRef` and `React.lazy(() => import('./components/ChatContainer'))`
- [ ] 1.2 Create `BoostAdminPage` routable extension using `settingsAdminRouteRef`
- [ ] 1.3 Create `BoostAgentStudioPage` routable extension using `agentCreateRouteRef`
- [ ] 1.4 Export new extensions from `src/index.ts`
- [ ] 1.5 Document frontend wiring config for each extension in `dynamic-plugins.yaml` examples

## 2. Lazy Loading (P1)

- [ ] 2.1 Replace static imports of Kagenti components in `ChatView.tsx` (lines 31-41) with `React.lazy()`
- [ ] 2.2 Add `React.lazy()` to `AdminLayout.tsx` for each panel group
- [ ] 2.3 Add `<Suspense>` boundaries with loading indicators at each lazy boundary

## 3. Feature Flags (P1)

- [ ] 3.1 Add `augment.features` section to frontend `config.d.ts` schema
- [ ] 3.2 Register feature flags with Backstage `featureFlagsApiRef` in `createPlugin` call
- [ ] 3.3 Create `useFeatureFlags` hook that reads from `configApiRef` with `featureFlagsApiRef` overrides
- [ ] 3.4 Gate `agentCreation`, `devSpaces`, `workflowBuilder`, `sandbox`, `observability`, `adminPanel` behind feature flags
- [ ] 3.5 Remove hardcoded `KagentiFeatureFlags` server-side check for sandbox (replace with config flag)

## 4. Verify

- [ ] 4.1 Verify `BoostChatPage` renders independently without admin panel code loaded
- [ ] 4.2 Verify feature flags disable features in both app-config and Backstage Settings UI
- [ ] 4.3 Verify each composable extension loads only its own code — no eager cross-extension imports
- [ ] 4.4 Verify initial bundle size meets target (composable extensions, not monolithic)
