---
'@red-hat-developer-hub/backstage-plugin-orchestrator': patch
'@red-hat-developer-hub/backstage-plugin-orchestrator-common': patch
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-api': patch
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': patch
---

Add Run as Event when `orchestrator.kafka` is configured: send `isEvent` with execute input, redirect to workflow runs with a notice when the response id is `kafkaEvent`.
