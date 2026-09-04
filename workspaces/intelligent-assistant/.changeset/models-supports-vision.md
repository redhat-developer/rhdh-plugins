---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': minor
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': patch
---

`GET /v1/models` now returns a `supportsVision` flag on each model, so the frontend can gate image attachments directly from the model list without a per-user `POST /v1/validate-model-vision` round-trip. Each LLM's capability is probed once via a lightweight LCS test-inference and memoised in a shared cache keyed by the model identifier: a confirmed `true` for 24h, a `false` only briefly (LCS returns the same 5xx for a genuinely non-vision model and a transient error, so a real model recovers quickly). Non-LLM models (e.g. embeddings) are reported as `supportsVision: false` without a probe, and a single failed probe no longer blocks the whole list.
