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
- 5394da1: Refresh DCM plugin API reports and align UI internals around shared route/tab constants and reusable detail components.
- ba41609: Add Docker/Podman deployment support for the DCM plugin.

  - Added `Dockerfile` (multi-stage build) to produce a standalone Backstage image
  - Added `app-config.production.yaml` for container runtime configuration
  - Added `scripts/generate-image.sh` (renamed from `dynamic-plugins.sh`) with commands to build and push both the OCI dynamic-plugin artifact and the full Backstage application image
  - Added `.dockerignore` to exclude sensitive and dev-only files from the build context
  - Configured guest auth (`dangerouslyAllowOutsideDevelopment`) for container environments
  - Skip SSO token exchange in the backend proxy when `clientId`/`clientSecret` are not set

- Updated dependencies [ba41609]
- Updated dependencies [e3985a8]
- Updated dependencies [c287a53]
- Updated dependencies [4a316f7]
  - @red-hat-developer-hub/backstage-plugin-dcm-common@2.0.0
