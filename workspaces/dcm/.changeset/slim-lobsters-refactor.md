---
'@red-hat-developer-hub/backstage-plugin-dcm': minor
'@red-hat-developer-hub/backstage-plugin-dcm-backend': minor
'@red-hat-developer-hub/backstage-plugin-dcm-common': minor
---

Refactor DCM frontend plugin for reusability, maintainability, and test coverage.

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
