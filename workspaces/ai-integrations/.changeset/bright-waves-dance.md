---
'@red-hat-developer-hub/backstage-plugin-kserve-kubeflow-connector-backend': patch
---

Use metadata.resourceVersion instead of status condition timestamps to detect InferenceService changes, fixing missed annotation-only updates.
