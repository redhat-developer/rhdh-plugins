---
'@red-hat-developer-hub/backstage-plugin-bulk-import': patch
---

Fixed routing to handle `/bulk-import` path correctly by adding internal redirect to `/bulk-import/repositories`. The plugin now automatically redirects from the base path to the repositories view, eliminating the need for host applications to configure separate redirect routes. This resolves the 404 error when accessing `/bulk-import` directly in RHDH.
