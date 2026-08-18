---
'@red-hat-developer-hub/backstage-plugin-dcm': minor
---

Remove legacy Environments and Service Specs screens.

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
