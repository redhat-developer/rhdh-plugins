---
'@red-hat-developer-hub/backstage-plugin-x2a-backend': patch
'@red-hat-developer-hub/backstage-plugin-x2a': patch
'@red-hat-developer-hub/backstage-plugin-scaffolder-backend-module-x2a': patch
---

Introducing projects by groups. Additional RBAC hardening.

- require x2a permissions to access the UI
- enforce better the x2a permissions on the endpoints
- projects can be optionally owned by a Backstage group, still defaults to the logged-in user
