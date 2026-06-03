---
'@red-hat-developer-hub/backstage-plugin-dcm': patch
---

Fix pagination not resetting to page 1 when a search/filter is applied.

When a user navigates to a later page and then types in the search field, the
table would appear empty because the page index was left pointing past the end
of the now-smaller filtered result set.

All table components now reset to page 0 whenever the search or filter value
changes, consistent with the existing behaviour in `DcmEntitiesCard`.

Affected tabs: Providers, Policies, Catalog Items, Catalog Item Instances,
Resources, Service Types, Service Specs, Environments, and Request History.
