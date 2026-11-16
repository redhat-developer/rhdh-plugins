---
'@red-hat-developer-hub/backstage-plugin-analytics-module-adoption-insights': patch
'@red-hat-developer-hub/backstage-plugin-adoption-insights-backend': patch
---

Buffered events are now sent in batches of at most `maxBufferSize`, so a backlog built up while the backend is unavailable stays within the backend's per-request limit (`maxEventsPerRequest`). A batch rejected with HTTP 4xx is dropped without affecting later batches. After a network error or HTTP 5xx, the failed batch and everything after it are requeued for the next flush. Only one flush runs at a time. The queue of unsent events is capped at 1000 events, and the oldest events are dropped first. An invalid `maxBufferSize` (not a positive integer) now logs a warning and falls back to the default of 20.

The backend README now explains that `maxBufferSize` should be kept at or below `maxEventsPerRequest`, and how the analytics module retries failed batches.
