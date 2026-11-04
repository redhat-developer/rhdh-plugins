---
'@red-hat-developer-hub/backstage-plugin-adoption-insights-backend': minor
'@red-hat-developer-hub/backstage-plugin-analytics-module-adoption-insights': patch
---

Resolve Scaffolder time-saved estimates from catalog annotations, expose an aggregate Adoption Insights query, and include task runs and historical minutes saved in top template results with optional ranking by runs. Newly accepted events of every type use the authenticated user's identity for `user_ref`, regardless of a client-supplied `userName`. Historical Scaffolder create events already stored minutes when an estimate was present, but those values were supplied by clients; new values are resolved from the catalog.

Clarify in the analytics module README that `identityApi` is required and how user context and authenticated credentials are used when events are sent to the backend.
