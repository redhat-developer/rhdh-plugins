---
'@red-hat-developer-hub/backstage-plugin-kserve-kubeflow-connector-backend': patch
---

Filter the reconciliation tracking set through readiness checks so that stopped InferenceServices are excluded, allowing the cleanup logic to properly delete their stale catalog entries.
