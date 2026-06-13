# @red-hat-developer-hub/backstage-plugin-dcm

## 1.1.0

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

- 019e9e2: Remove legacy Environments and Service Specs screens.

  **Removed routes**

  - `/dcm/environments` — `EnvironmentsTabContent` list page (was already orphaned from active navigation)
  - `/dcm/service-specs` — `ServiceSpecsTabContent` list page (was already orphaned from active navigation)
  - `/dcm/environments/:id/*` — `EnvironmentDetailsPage` with Overview, Entities, and Request History sub-tabs
  - `/dcm/service-specs/:id/*` — `ServiceSpecDetailsPage` with Overview, Entities, and Request History sub-tabs

  **Removed route refs**

  - `serviceSpecsRouteRef`
  - `environmentDetailsRouteRef`
  - `serviceSpecDetailsRouteRef`
  - `DCM_DETAILS_TABS`

  **Removed shared components (legacy-only)**

  - `DcmEntitiesTable`, `DcmRequestHistoryTable`, `DcmDetailsBreadcrumb`, `dataCenterNavigation`, `serviceSpecYaml`

  **Removed mock data layer**

  - `data/environments.ts`, `data/service-specs.ts`, `data/dcm-mock-rows.ts`

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

- 5394da1: UI code-quality improvements: replace all inline styles with makeStyles classes, use theme palette tokens (status.ok, error, text) instead of hardcoded colours, merge duplicate style files into a single useDcmStyles hook, add destructive-action styling to delete dialogs, and move RhdhLogoFull/RhdhLogoIcon into the plugin so they can be wired in RHDH without relying on the dev-only app shell.
- 483a960: Show a success snackbar after every CRUD operation in the Providers, Policies, and Catalog Items tabs.

  - Extended `useCrudTab` with optional `createSuccessMessage`, `editSuccessMessage`, and `deleteSuccessMessage` options and a `successMessage` / `clearSuccessMessage` pair in the returned result.
  - Wired `DcmSuccessSnackbar` into `ProvidersTabContent`, `PoliciesTabContent`, and `CatalogItemsTabContent` with contextual messages (e.g. "Provider registered successfully.", "Policy deleted successfully.").
  - Fixed a bug where deleting the last item on a non-zero page left the table showing "No records to display" instead of navigating back to the last valid page.

- 0239de6: Disable the Provider Name field when editing an existing provider.

  The Name field in the Edit Provider dialog is now read-only. Provider names are
  immutable identifiers and should not be changed after creation.

- 4da4d17: Enhance the Delete Dialog UX: keep the dialog open on API errors and display them inline, disable the Delete button and show a loading spinner during submission to prevent double-clicks, use an error-red background for the Delete button, and suppress the external action alert for delete errors in favour of the in-dialog error banner.
- 30fb181: Fix form UX issues in the Catalog Items and Catalog Item Instances screens.

  - Catalog Items: service_type is now required; the field shows a validation error and blocks submission when no service type is selected.
  - Catalog Item Instances: the Create button is now disabled when the form is invalid, consistent with other tabs.
  - Catalog Item Instances: clicking the Rehydrate icon now shows a confirmation dialog warning that rehydrating may assign a new resource ID.
  - Catalog Item Instances: fields with a boolean schema type now render as a Switch instead of a plain text input.

- 8f788d6: Replace hardcoded colors and shadows with theme-aware values for dark mode support.

  - ProviderStatus: chip border now uses `theme.palette.divider` instead of `rgba(0,0,0,0.2)`
  - CopyButton: "copied" checkmark color now uses `theme.palette.success.main` instead of `#28a745`
  - dcmStyles: overview card box-shadow is suppressed in dark mode via `theme.palette.type` check

- 201cdbe: Fix pagination not resetting to page 1 when a search/filter is applied.

  When a user navigates to a later page and then types in the search field, the
  table would appear empty because the page index was left pointing past the end
  of the now-smaller filtered result set.

  All table components now reset to page 0 whenever the search or filter value
  changes, consistent with the existing behaviour in `DcmEntitiesCard`.

  Affected tabs: Providers, Policies, Catalog Items, Catalog Item Instances,
  Resources, Service Types, Service Specs, Environments, and Request History.

- 11dc527: Fix policy form validation for Description and Priority fields, normalize enabled
  checks, and reject whitespace-only required fields.

  - Add a 255-character max-length Yup rule to the Description field, with inline error
    feedback matching the Display Name pattern (validation error on blur rather than
    hard-blocking input at the DOM level).
  - Add `.integer()` and `.required()` Yup rules to the Priority field so decimal values
    (e.g. 500.5) and an empty field are rejected with an explicit error message instead of
    silently coercing to an integer or defaulting to 500.
  - Add `step={1}` to the Priority number input and block `.`/`e`/`E` characters via
    `onKeyDown` and `onChange` guards to prevent decimal strings from bypassing the Yup
    integer check through JavaScript's `Number()` coercion.
  - Update the Priority label to "Priority \*" to indicate it is a required field.
  - Update the Priority helper text to surface the API uniqueness constraint
    (priority must be unique per policy type) so users are informed before hitting a 409.
  - Normalize the three inconsistent `enabled` checks in `PoliciesTabContent` to
    `p.enabled ?? true` so the Enabled column, Actions toggle, and edit form all agree
    when `enabled` is undefined.
  - Add `.trim()` to the `display_name` and `rego_code` Yup rules so whitespace-only
    values are rejected client-side instead of passing validation and being silently
    rejected by the API after submit.

- eab245a: Catalog Item: validate duplicate paths, block adding empty field rows, live-validate JSON in schema modal, surface invalid default_value / validation_schema inline. Policy: add structural Rego validation (package declaration + selected_provider reference) and monospace font to the code editor. Catalog Instance: enforce required/min/max constraints from validation_schema on user-value fields and enable submit-button gating.
- 5394da1: Refresh DCM plugin API reports and align UI internals around shared route/tab constants and reusable detail components.
- ba41609: Add Docker/Podman deployment support for the DCM plugin.

  - Added `Dockerfile` (multi-stage build) to produce a standalone Backstage image
  - Added `app-config.production.yaml` for container runtime configuration
  - Added `scripts/generate-image.sh` (renamed from `dynamic-plugins.sh`) with commands to build and push both the OCI dynamic-plugin artifact and the full Backstage application image
  - Added `.dockerignore` to exclude sensitive and dev-only files from the build context
  - Configured guest auth (`dangerouslyAllowOutsideDevelopment`) for container environments
  - Skip SSO token exchange in the backend proxy when `clientId`/`clientSecret` are not set

- 23ab1ea: Add a manual refresh button to the Providers table to update health status without a full page reload.

  A sync icon button now appears next to the search field in the Providers card header. Clicking it re-fetches the provider list (including `health_status`) while keeping the table visible. A spinner is shown on the button during the request. The initial page load behaviour is unchanged.

- Updated dependencies [ba41609]
- Updated dependencies [e3985a8]
- Updated dependencies [c287a53]
- Updated dependencies [4a316f7]
  - @red-hat-developer-hub/backstage-plugin-dcm-common@2.0.0
