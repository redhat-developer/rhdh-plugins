# Agent Lifecycle Approval Workflow

SonataFlow workflow that automates the agent lifecycle approval process in RHDH.

## Overview

When an agent is submitted for review (`draft -> review`), this workflow:

1. **Notifies admins** via Backstage Notifications that a new agent is pending review
2. **Suspends** in a `callback` state, waiting for an admin decision CloudEvent
3. On **approval**: promotes the agent to `staging` and notifies the creator
4. On **rejection**: demotes the agent to `draft` with a reason and notifies the creator
5. On **timeout** (72 hours): sends an escalation notification and re-enters the wait state

## Architecture

```
Agent Creator                   SonataFlow                      Admin
     |                              |                             |
     |-- submit for review -------->|                             |
     |                              |-- notify admins ----------->|
     |                              |                             |
     |                              |   (callback state)          |
     |                              |   waits for CloudEvent      |
     |                              |                             |
     |                              |<-- approval decision -------|
     |                              |    (CloudEvent with         |
     |                              |     kogitoprocrefid)        |
     |                              |                             |
     |<-- approval notification ----|                             |
     |                              |-- promote to staging ------>|
```

## CloudEvent Format

The admin decision CloudEvent must include:

```json
{
  "specversion": "1.0",
  "type": "io.rhdhorchestrator.agent.approval.decision",
  "source": "augment.admin",
  "id": "<unique-event-id>",
  "kogitoprocrefid": "<workflow-instance-id>",
  "datacontenttype": "application/json",
  "data": {
    "approved": true,
    "decidedBy": "user:default/admin-name",
    "reason": "Optional reason (required for rejections)"
  }
}
```

## Prerequisites

- SonataFlow Operator installed on OpenShift
- Knative Eventing with a Broker configured
- Backstage Notifications plugin enabled
- OIDC client configured for service-to-service auth

## Deployment

1. Create a `SonataFlow` CR referencing this workflow
2. Configure environment variables in `application.properties`
3. Set up a Knative Trigger to route `io.rhdhorchestrator.agent.approval.decision` events to the workflow
4. Configure the Augment backend to emit CloudEvents on admin approve/reject actions

## Configuration

| Variable               | Description                     | Default                                                                       |
| ---------------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| `NOTIFICATIONS_URL`    | Backstage Notifications API URL | `http://backstage-backend.backstage.svc.cluster.local:7007/api/notifications` |
| `AUGMENT_BACKEND_URL`  | Augment plugin backend URL      | `http://backstage-backend.backstage.svc.cluster.local:7007/api/augment`       |
| `K_SINK`               | Knative Eventing sink URL       | `http://broker-ingress.knative-eventing.svc.cluster.local/default/default`    |
| `OIDC_CLIENT_ID`       | OIDC client ID for service auth | `sonataflow-agent-approval`                                                   |
| `OIDC_CLIENT_SECRET`   | OIDC client secret              | (required)                                                                    |
| `OIDC_AUTH_SERVER_URL` | Keycloak/OIDC server URL        | (required)                                                                    |
