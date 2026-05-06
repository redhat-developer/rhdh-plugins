# @red-hat-developer-hub/backstage-plugin-dcm-backend

## 2.0.0

### Major Changes

- c287a53: Developing DCM Plugin skeleton

### Minor Changes

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

- c9312e8: Fix 502 error when SSO credentials are not configured.

  The backend proxy now skips the SSO token exchange when `clientId` or
  `clientSecret` are absent, forwarding requests to the API gateway without
  an Authorization header instead of failing with "Failed to obtain upstream
  access token."

- Updated dependencies [ba41609]
- Updated dependencies [e3985a8]
- Updated dependencies [c287a53]
- Updated dependencies [4a316f7]
  - @red-hat-developer-hub/backstage-plugin-dcm-common@2.0.0
