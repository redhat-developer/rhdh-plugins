---
'@red-hat-developer-hub/backstage-plugin-adoption-insights-backend': minor
'@red-hat-developer-hub/backstage-plugin-analytics-module-adoption-insights': patch
---

Resolve Scaffolder time-saved estimates from catalog annotations, expose an aggregate Adoption Insights query, and include task runs and historical minutes saved in top template results with optional ranking by runs. Newly accepted events of every type use the authenticated user's identity for `user_ref`, regardless of a client-supplied `userName`. Historical Scaffolder create events already stored minutes when an estimate was present, but those values were supplied by clients; new values are resolved from the catalog. Event batches are validated before any catalog lookup or enqueue, oversized batches are rejected up front (configurable via `app.analytics.adoptionInsights.maxEventsPerRequest` with a positive integer; default 100), and repeated Template refs are resolved once per batch with bounded concurrency. Validation is now all-or-nothing per batch: if any event in a `POST /events` request is invalid the whole request is rejected and no events from it are stored, whereas previously valid events preceding the first invalid one could be persisted.

Clarify in the analytics module README that `identityApi` is required and how user context and authenticated credentials are used when events are sent to the backend. The analytics module now logs and drops rejected event batches on HTTP 4xx responses, while retrying batches after network errors or HTTP 5xx responses.
