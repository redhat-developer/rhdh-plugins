---
'@red-hat-developer-hub/backstage-plugin-dcm': patch
---

Show a success snackbar after every CRUD operation in the Providers, Policies, and Catalog Items tabs.

- Extended `useCrudTab` with optional `createSuccessMessage`, `editSuccessMessage`, and `deleteSuccessMessage` options and a `successMessage` / `clearSuccessMessage` pair in the returned result.
- Wired `DcmSuccessSnackbar` into `ProvidersTabContent`, `PoliciesTabContent`, and `CatalogItemsTabContent` with contextual messages (e.g. "Provider registered successfully.", "Policy deleted successfully.").
- Fixed a bug where deleting the last item on a non-zero page left the table showing "No records to display" instead of navigating back to the last valid page.
