---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': minor
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': patch
---

`GET /v1/models` now returns a `supportsVision` flag on each model. The backend probes vision capability once per model per pod (memoised for 24h) and enriches the model list, so the frontend can gate image attachments directly from the model list without a per-user `POST /v1/validate-model-vision` round-trip. Non-LLM models (e.g. embeddings) are reported as `supportsVision: false` without a probe, and a single failed probe no longer blocks the whole list.
