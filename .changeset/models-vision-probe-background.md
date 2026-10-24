---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': patch
---

Speed up `GET /v1/models` by no longer blocking the response on per-model vision-capability probes. Vision support is served from cache and probed in the background — the cache is warmed at startup and self-heals on cache miss (a model new to the LCS list, or one whose previous probe failed) — so the endpoint returns immediately instead of waiting up to the probe timeout per model.
