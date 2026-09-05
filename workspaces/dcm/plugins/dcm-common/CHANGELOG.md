# @red-hat-developer-hub/backstage-plugin-dcm-common

## 2.0.0

### Major Changes

- c287a53: Developing DCM Plugin skeleton
- 4c64d69: Add multi-resource support for Catalog Items and Catalog Item Instances.

  **API type changes (`dcm-common`)**

  - `CatalogItemSpec` now holds a `resources?: CatalogResource[]` array instead of a single `service_type` + `fields`.
  - New `CatalogResource` interface: `{ name, service_type, requires_resources?, fields? }`.
  - `UserValue` gains a required `resource` field that identifies which resource the value targets.
  - `CatalogItemInstanceSpec` gains `resource_ids?: string[]` (replaces the top-level `resource_id`).

  **UI changes (`dcm`)**

  - Catalog Item create/edit now uses a vertical-tabbed wizard dialog (`CatalogItemWizardDialog`) with tabs: Overview, API, Resources, and one tab per resource for field configurations.
  - Catalog Item Instance create now uses a vertical-tabbed wizard dialog (`InstanceWizardDialog`) with an Overview tab and one tab per resource that has editable fields.
  - Shared components extracted: `VerticalTabDialog`, `SchemaButton`, `ResourceFieldsPanel`, `UserValueFields`.
  - Shared utility `validateJsonObject` de-duplicates JSON-object validation across `SchemaButton` and `catalogItemFormTypes`.
  - Table columns updated: "Service type" replaced by "Resources" (chips per service_type); field count sums across all resources.

- 5fba63c: Replace Providers tab with Agents tab.

  **BREAKING CHANGES**

  The following `@public` exports have been removed:

  - `@red-hat-developer-hub/backstage-plugin-dcm-common`: `ProvidersApi`, `ProvidersClient`, `Provider`, `ProviderList`, `ProviderMetadata`, `ProviderStatus`, `ResourceCapacity`
  - `@red-hat-developer-hub/backstage-plugin-dcm`: `providersApiRef`

  These symbols were removed because the Providers API has been deprecated by the
  DCM API team and is no longer available.

  **Note:** DCM 1.x has no production consumers at this time.

  ***

  A new Agents tab has been added as the default landing tab, backed by the
  Agent API (v1alpha1). Agents register with the control plane and send periodic
  heartbeats. The UI supports listing agents with health-status filtering and
  registering new agents.

  **Follow-up**: FLPATH-4773 — rename the Resources tab "Provider" column to
  "Environment" once the Resources API replaces `provider_name` with an agent
  reference, and mark resources as degraded when the associated agent is
  unavailable.

### Minor Changes

- e3985a8: DCM UI and catalog client updates for the example app and published plugins.

  **Example app (`packages/app`) — RBAC navigation**

  - Removed the **RBAC** sidebar entry under Administration and the `/rbac` route.
  - Dropped the `@backstage-community/plugin-rbac` frontend dependency. The RBAC backend plugin may remain for permissions; only the menu and page were removed.

  **`@red-hat-developer-hub/backstage-plugin-dcm` — Resources tab**

  - Removed the **Resources** tab from the Data Center page and all **Placement / `resources`** proxy usage from the plugin.
  - Removed `placementApiRef`, `resources` route ref, and the `PlacementClient` integration from the plugin surface.

  **`@red-hat-developer-hub/backstage-plugin-dcm-common` — placement API removed; catalog rehydrate**

  - Removed the Placement API client, types, and tests tied to the internal `resources` API.
  - Added **`rehydrateCatalogItemInstance`** on `CatalogApi` / `CatalogClient`: `POST .../catalog-item-instances/{id}:rehydrate`.

  **Catalog item instances UI**

  - Added a **Rehydrate** action (outlined button with refresh icon) on each instance row, success and error snackbars, and a unit test for the new client method.

- 2022ea0: Add server-side cursor pagination to all tabs and harden pagination handling across APIs.

  **All six tabs now use server-side cursor pagination**

  Previously only Service Types, Catalog Items, and Catalog Item Instances fetched data page-by-page from the backend. Providers, Policies, and Resources loaded everything in a single call and silently lost records beyond the first page.

  - **Providers** and **Policies** — converted to `usePaginatedCrudTab` (same pattern as Catalog Items). Next / Previous buttons appear below the table; search filters the current page client-side without an extra round-trip.
  - **Resources** — converted to `usePaginatedFetch` (same as Service Types). Retains the same read-only layout.

  **`dcm-common`: new pagination utilities and updated API interfaces**

  - `buildPaginationQuery` extracted from `CatalogClient` into `dcm-common/src/utils/buildPaginationQuery.ts` and exported publicly so all clients can share the same URL-builder.
  - `ProvidersApi` / `ProvidersClient` — `listProviders` now accepts an optional `PaginationParams` argument.
  - `PolicyManagerApi` / `PolicyManagerClient` — `listPolicies` now accepts an optional `PaginationParams` argument.
  - `ServiceTypeList`, `CatalogItemList`, `CatalogItemInstanceList` — `next_page_token` is now optional (`?`) to match the real backend behaviour where the field is absent (not just empty) when there is only one page of results.

  **Dropdown options loaded once on mount**

  Service-type dropdown loads (used in the Providers and Catalog Items create/edit forms) are now fetched once on component mount via a dedicated `useEffect`, not on every page navigation. The request uses `max_page_size: 100` to avoid silently truncating valid options.

  **Test coverage**

  Added `ProvidersTabContent.test.tsx` and `ResourcesTabContent.test.tsx` with full cursor navigation test suites (initial load, error/retry, Next/Previous button states and token passing). Updated `PoliciesTabContent.test.tsx` with equivalent cursor navigation tests and refreshed mock return types.

- 4a316f7: Refactor DCM frontend plugin for reusability, maintainability, and test coverage.

  **New shared utilities & hooks**

  - `createYupValidator` – factory that wraps a Yup schema and returns stable `validate` / `isValid` helpers, eliminating per-tab validation boilerplate.
  - `useCrudTab` – custom React hook that centralises data loading, client-side search/pagination, and create/edit/delete dialog state for every CRUD tab. Tabs now consist only of feature-specific rendering logic.

  **New shared components**

  - `DcmCrudTabLayout` – generic layout that handles loading spinners, load-error alerts with a Retry button, empty states, and a searchable paginated table inside an `InfoCard`.
  - `DcmFormDialogActions` – reusable Save / Cancel button row with loading spinner and disabled states, used by all form dialogs.
  - `DcmErrorSnackbar` – transient error snackbar for surfacing delete-operation failures.
  - `DcmDeleteDialog` – standalone confirmation dialog component extracted from inline usage.

  **Per-feature file decomposition**

  Each CRUD tab now has dedicated files for form types, Yup schema, field components, and column definitions:

  - `providers/` → `providerFormTypes.ts`, `components/ProviderFormFields.tsx`, `components/ProviderStatus.tsx`, `components/CopyButton.tsx`
  - `policies/` → `policyFormTypes.ts`, `components/PolicyFormFields.tsx`
  - `catalog-items/` → `catalogItemFormTypes.ts`, `components/CatalogItemFormFields.tsx`
  - `catalog-item-instances/` → `instanceFormTypes.ts`, `components/InstanceFormFields.tsx`
  - `resources/` → `resourceFormTypes.ts`, `components/ResourceFormFields.tsx`

  **Error handling improvements**

  Load errors and delete errors are now surfaced in the UI via `DcmCrudTabLayout` (inline alert with Retry) and `DcmErrorSnackbar` respectively, replacing silent `.catch(() => {})` handlers.

  **Dead code removal**

  Removed the unused `ExampleComponent` directory and its tests.

  **Test coverage**

  Added unit tests for `extractApiError`, `createYupValidator`, `useCrudTab`, `DcmFormDialogActions`, `DcmDeleteDialog`, and form-type validators for providers, policies, and resources.

### Patch Changes

- ba41609: Add Docker/Podman deployment support for the DCM plugin.

  - Added `Dockerfile` (multi-stage build) to produce a standalone Backstage image
  - Added `app-config.production.yaml` for container runtime configuration
  - Added `scripts/generate-image.sh` (renamed from `dynamic-plugins.sh`) with commands to build and push both the OCI dynamic-plugin artifact and the full Backstage application image
  - Added `.dockerignore` to exclude sensitive and dev-only files from the build context
  - Configured guest auth (`dangerouslyAllowOutsideDevelopment`) for container environments
  - Skip SSO token exchange in the backend proxy when `clientId`/`clientSecret` are not set
