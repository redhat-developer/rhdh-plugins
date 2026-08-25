---
'@red-hat-developer-hub/backstage-plugin-dcm': minor
'@red-hat-developer-hub/backstage-plugin-dcm-common': minor
---

Replace Providers tab with Agents tab.

The Providers API has been removed by the DCM API team and is no longer available.
All provider-related UI, types, and client code have been removed.

A new Agents tab has been added as the default landing tab, backed by the
Agent API (v1alpha1). Agents register with the control plane and send periodic
heartbeats. The UI supports listing agents with health-status filtering and
registering new agents.
