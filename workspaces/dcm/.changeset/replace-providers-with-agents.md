---
'@red-hat-developer-hub/backstage-plugin-dcm': major
'@red-hat-developer-hub/backstage-plugin-dcm-common': major
---

Replace Providers tab with Agents tab.

**BREAKING CHANGES**

The following `@public` exports have been removed:

- `@red-hat-developer-hub/backstage-plugin-dcm-common`: `ProvidersApi`, `ProvidersClient`, `Provider`, `ProviderList`, `ProviderMetadata`, `ProviderStatus`, `ResourceCapacity`
- `@red-hat-developer-hub/backstage-plugin-dcm`: `providersApiRef`

These symbols were removed because the Providers API has been deprecated by the
DCM API team and is no longer available.

**Note:** DCM 1.x has no production consumers at this time.

---

A new Agents tab has been added as the default landing tab, backed by the
Agent API (v1alpha1). Agents register with the control plane and send periodic
heartbeats. The UI supports listing agents with health-status filtering and
registering new agents.

**Follow-up**: FLPATH-4773 — rename the Resources tab "Provider" column to
"Environment" once the Resources API replaces `provider_name` with an agent
reference, and mark resources as degraded when the associated agent is
unavailable.
