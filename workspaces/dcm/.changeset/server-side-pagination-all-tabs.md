---
'@red-hat-developer-hub/backstage-plugin-dcm': minor
'@red-hat-developer-hub/backstage-plugin-dcm-common': minor
---

Add server-side cursor pagination to all tabs and harden pagination handling across APIs.

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
