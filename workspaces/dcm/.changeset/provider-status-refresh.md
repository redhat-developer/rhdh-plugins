---
'@red-hat-developer-hub/backstage-plugin-dcm': patch
---

Add a manual refresh button to the Providers table to update health status without a full page reload.

A sync icon button now appears next to the search field in the Providers card header. Clicking it re-fetches the provider list (including `health_status`) while keeping the table visible. A spinner is shown on the button during the request. The initial page load behaviour is unchanged.
