---
'@red-hat-developer-hub/backstage-plugin-dcm': patch
---

Fix form UX issues in the Catalog Items and Catalog Item Instances screens.

- Catalog Items: service_type is now required; the field shows a validation error and blocks submission when no service type is selected.
- Catalog Item Instances: the Create button is now disabled when the form is invalid, consistent with other tabs.
- Catalog Item Instances: clicking the Rehydrate icon now shows a confirmation dialog warning that rehydrating may assign a new resource ID.
- Catalog Item Instances: fields with a boolean schema type now render as a Switch instead of a plain text input.
