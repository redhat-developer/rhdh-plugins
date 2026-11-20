---
'@red-hat-developer-hub/backstage-plugin-global-header': patch
---

Safely resolve user profile and identity via `useUserIdentity` instead of hard dependency on `catalogApiRef` in `useUserProfile`, safely check `searchApiRef` in `SearchComponent`, and dynamically check for Scaffolder availability in `SelfServiceButton` before rendering the Self-service button, allowing the global header to function properly when core plugins like catalog, scaffolder, or search are disabled or decoupled.
