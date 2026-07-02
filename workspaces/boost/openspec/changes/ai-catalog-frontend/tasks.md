# Tasks: AI Catalog Frontend

## 1. Plugin Scaffold and Dev App (RHIDP-15165)

- [ ] 1.1 Scaffold `plugins/boost` via `backstage-cli new` (NFS frontend-plugin template). Do not create plugin files manually — if the CLI fails, report the error.
- [ ] 1.2 Configure `createFrontendPlugin` with `PageBlueprint` at `/ai-catalog` as default export
- [ ] 1.3 Add `EntityCardBlueprint` stubs (summary, download, version) with `isAiAsset` filter
- [ ] 1.4 Add `EntityContentBlueprint` stub (usage tab) with `isAiAsset` filter
- [ ] 1.5 Implement `isAiAsset(entity)` condition filter checking kind + `spec.type`
- [ ] 1.6 Implement `useAiAssets(filters)` hook wrapping `catalogApiRef`
- [ ] 1.7 Create placeholder `AiCatalogPage` component
- [ ] 1.8 Scaffold dev app and backend: run `npx @backstage/create-app` in a temp directory, copy `packages/app` and `packages/backend` into the boost workspace, then adapt. Do not create these packages manually — if the CLI fails, report the error.
- [ ] 1.9 Adapt dev app to NFS pattern (createApp from frontend-defaults, nav module, sign-in module) and dev backend (app-backend, catalog-backend, auth + guest provider, boost-backend)
- [ ] 1.10 Create sample `catalog-info.yaml` fixtures for all AI asset types (AiResource/skill, AiResource/rule, API/mcp-server, Component/ai-agent, Resource/ai-model) with `rhdh.io/ai-asset-*` annotations
- [ ] 1.11 Add `app-config.yaml` with catalog fixture locations
- [ ] 1.12 Set up i18n scaffold: translation resource file, TranslationBlueprint module
- [ ] 1.13 Add first unit test using `TestApiProvider` + `renderInTestApp`
- [ ] 1.14 Verify `yarn start` launches dev app with AI Catalog in sidebar
- [ ] 1.15 Verify `yarn test` passes

## 2. Browse Page with Search and Filters (RHIDP-15166)

- [ ] 2.1 Implement `AiCatalogPage` with responsive card grid layout (BUI Grid.Root/Grid.Item, 3 columns desktop, 1 mobile)
- [ ] 2.2 Implement `AiAssetCard` with BUI Card — name, description, category badge, lifecycle, tags, owner, version, source
- [ ] 2.3 Add category grouping (tabs or section headers for each asset category)
- [ ] 2.4 Implement debounced search bar (BUI SearchField, 300ms, filters by name/description/tags)
- [ ] 2.5 Implement filter controls — category (CheckboxGroup), lifecycle (CheckboxGroup), tags (Select multi), owner (SearchAutocomplete), source (CheckboxGroup)
- [ ] 2.6 Filters combine as AND; URL query param sync for all filter + search state
- [ ] 2.7 Add client-side pagination (BUI TablePagination) and sort control (name, last updated)
- [ ] 2.8 Implement loading state (BUI Skeleton cards), empty state ("No AI assets match" + clear-filters), error state (BUI Alert + Retry)
- [ ] 2.9 Add error boundary so catalog-unreachable does not crash RHDH shell
- [ ] 2.10 Card click navigates to catalog entity detail page (`/catalog/:namespace/:kind/:name`)
- [ ] 2.11 i18n: all user-facing strings via translation resources
- [ ] 2.12 WCAG 2.1 AA: keyboard nav, screen reader labels, focus management on filter changes
- [ ] 2.13 Unit tests for card rendering, filter logic, search, pagination, empty/error states

## 3. Entity Page Extensions and Adoption Actions (RHIDP-15167)

- [ ] 3.1 Implement `AiAssetSummaryCard` — category badge, version, source, lifecycle
- [ ] 3.2 Implement `DownloadAdoptCard` — conditional on `spec.location.type`:
  - git: Download button, calls backend proxy, loading spinner, error toast
  - oci: BUI Tabs for docker/podman toggle, pull command from `spec.location.target`, Copy button
  - absent: card not rendered
- [ ] 3.3 Implement `VersionListCard` — list all versions, highlight current/recommended, click navigates
- [ ] 3.4 Implement `UsageTab` — TechDocs when `backstage.io/techdocs-ref` present, external links fallback, "Contact owner" when permission missing (defaults to allow until RHDHPLAN-1508 lands)
- [ ] 3.5 Wire all cards and tab into plugin via EntityCardBlueprint/EntityContentBlueprint with `isAiAsset` filter
- [ ] 3.6 Add backend download proxy route in `boost-backend`: `GET /api/boost/catalog/download` — accepts entity ref, resolves `spec.location.target`, authenticates to GitHub via `@backstage/integration`, streams ZIP
- [ ] 3.7 Permission check on download proxy (catalog entity read permission, AI Catalog permissions when available)
- [ ] 3.8 i18n: all user-facing strings via translation resources
- [ ] 3.9 WCAG 2.1 AA for all interactive elements
- [ ] 3.10 Unit tests for each card/tab, RBAC-gated rendering, download/copy behavior
