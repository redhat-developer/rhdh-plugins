---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': patch
---

Retry vector store attach and file upload requests when lightspeed-core responds with HTTP 429 Too Many Requests. lightspeed-core bounds concurrent file uploads and vector store attaches with per-endpoint semaphores and rejects excess requests rather than queuing them, so bursty notebook uploads could fail intermittently. `VectorStoresOperator` now retries these two calls, honoring the `Retry-After` header when present and otherwise backing off exponentially (capped, up to 8 attempts).
