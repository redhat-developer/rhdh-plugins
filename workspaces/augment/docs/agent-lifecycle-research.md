# Agent Lifecycle Governance -- Research Findings & Gap Analysis

## Executive Summary

This document captures the research findings from exploring the Kagenti API on the live OpenShift cluster, mapping the augment plugin's current agent creation/lifecycle code, and identifying bugs and gaps. It serves as the foundation for the Agent Lifecycle Governance Epic.

---

## 1. Kagenti API Surface (Live Cluster)

### Cluster Details

- **Cluster**: `apps.cluster-6crhb.6crhb.sandbox1011.opentlc.com`
- **Kagenti API**: `https://kagenti-api-kagenti-system.apps.cluster-6crhb.6crhb.sandbox1011.opentlc.com`
- **Keycloak**: `https://keycloak-keycloak.apps.cluster-6crhb.6crhb.sandbox1011.opentlc.com` (realm: `kagenti`)
- **RHDH**: namespace `rhdh`, pod `backstage-developer-hub-*`

### Authentication

- Keycloak realm `kagenti` with OIDC
- **Public client**: `kagenti` (for UI login)
- **Confidential client**: `kagenti-api` (for service-to-service, used by RHDH backend)
- Token TTL: 60 seconds (short -- must refresh frequently)
- Roles: `kagenti-admin`, `kagenti-operator`, `kagenti-viewer`, `admin`

### Complete API Endpoints

| Method     | Path                                                   | Purpose                          |
| ---------- | ------------------------------------------------------ | -------------------------------- |
| **GET**    | `/api/v1/agents`                                       | List all agents (scoped by auth) |
| **POST**   | `/api/v1/agents`                                       | Create agent (deploy to K8s)     |
| **GET**    | `/api/v1/agents/{ns}/{name}`                           | Get agent details                |
| **DELETE** | `/api/v1/agents/{ns}/{name}`                           | **Delete agent** (exists!)       |
| GET        | `/api/v1/agents/build-strategies`                      | List cluster build strategies    |
| POST       | `/api/v1/agents/fetch-env-url`                         | Fetch env from URL               |
| POST       | `/api/v1/agents/parse-env`                             | Parse .env content               |
| GET        | `/api/v1/agents/migration/migratable`                  | List migratable agents           |
| POST       | `/api/v1/agents/migration/migrate-all`                 | Bulk migrate                     |
| GET        | `/api/v1/agents/{ns}/{name}/route-status`              | Check HTTP route                 |
| GET        | `/api/v1/agents/{ns}/{name}/shipwright-build`          | Build status                     |
| GET        | `/api/v1/agents/{ns}/{name}/shipwright-build-info`     | Build config                     |
| GET/POST   | `/api/v1/agents/{ns}/{name}/shipwright-buildrun`       | Trigger/check build runs         |
| POST       | `/api/v1/agents/{ns}/{name}/finalize-shipwright-build` | Finalize build                   |
| POST       | `/api/v1/agents/{ns}/{name}/migrate`                   | Migrate single agent             |
| **GET**    | `/api/v1/tools`                                        | List all MCP tools               |
| **POST**   | `/api/v1/tools`                                        | Create MCP tool                  |
| **GET**    | `/api/v1/tools/{ns}/{name}`                            | Get tool details                 |
| **DELETE** | `/api/v1/tools/{ns}/{name}`                            | Delete tool                      |
| POST       | `/api/v1/tools/{ns}/{name}/connect`                    | Connect to tool                  |
| POST       | `/api/v1/tools/{ns}/{name}/invoke`                     | Invoke tool                      |
| GET        | `/api/v1/chat/{ns}/{name}/agent-card`                  | Get A2A agent card               |
| POST       | `/api/v1/chat/{ns}/{name}/send`                        | Send chat message                |
| POST       | `/api/v1/chat/{ns}/{name}/stream`                      | Stream chat                      |
| GET        | `/api/v1/namespaces`                                   | List available namespaces        |
| GET        | `/api/v1/auth/me`                                      | Current user info                |
| GET        | `/api/v1/auth/config`                                  | Auth configuration               |
| GET        | `/api/v1/auth/status`                                  | Auth status                      |
| GET        | `/api/v1/auth/userinfo`                                | Extended user info               |
| GET        | `/api/v1/config/features`                              | Feature flags                    |
| GET        | `/api/v1/config/dashboards`                            | Dashboard config                 |

### Key Schemas

**CreateAgentRequest** (required: `name`, `namespace`):

```
name, namespace, protocol (default: "a2a"), framework (default: "LangGraph"),
envVars[], workloadType (default: "deployment"), deploymentMethod (default: "source"),
gitUrl, gitPath, gitBranch, imageTag, registryUrl, registrySecret,
startCommand, containerImage, imagePullSecret, servicePorts[],
createHttpRoute, authBridgeEnabled, spireEnabled, envoyProxyInject,
spiffeHelperInject, clientRegistrationInject, shipwrightConfig
```

**AgentSummary**: `name, namespace, description, status, labels, workloadType?, createdAt?`

**DeleteResponse**: `success, message`

### K8s CRDs

| CRD                                      | Purpose                                      |
| ---------------------------------------- | -------------------------------------------- |
| `agentcards.agent.kagenti.dev`           | A2A agent card (fetched from running agent)  |
| `agentruntimes.agent.kagenti.dev`        | Agent runtime (wraps Deployment/StatefulSet) |
| `mcpgatewayextensions.mcp.kagenti.com`   | MCP gateway extensions                       |
| `mcpserverregistrations.mcp.kagenti.com` | MCP server registrations                     |
| `mcpvirtualservers.mcp.kagenti.com`      | MCP virtual servers                          |

### Critical Finding: Two Types of Agents

1. **API-managed agents**: Created via `POST /api/v1/agents`, tracked in Kagenti backend DB + K8s
2. **K8s-native agents**: Deployed directly via Helm/kubectl with `AgentRuntime` + `AgentCard` CRDs

The current mortgage-ai and branch-monitor agents are K8s-native (deployed via Helm). They have `AgentRuntime` and `AgentCard` CRDs but are **not visible** through `GET /api/v1/agents`. The Kagenti backend only lists agents it created.

---

## 2. RHDH Configuration for Augment Plugin

```yaml
augment:
  provider: kagenti
  security:
    mode: 'plugin-only'
    adminUsers:
      - 'user:default/admin'
      - 'user:default/temp-admin'
  kagenti:
    baseUrl: https://kagenti-api-kagenti-system.apps.cluster-6crhb.6crhb.sandbox1011.opentlc.com
    namespace: team1 # default namespace for new agents
    auth:
      tokenEndpoint: ...keycloak.../realms/kagenti/protocol/openid-connect/token
      clientId: kagenti-api # confidential client (service-to-service)
      clientSecret: ${KAGENTI_CLIENT_SECRET}
    showAllNamespaces: true
    skipTlsVerify: true
```

Available namespaces on cluster: `mortgage-ai`, `team1`, `team2`, `tr-agents`

---

## 3. As-Is User Journeys

### Journey A: Create Agent via Kagenti Wizard

**Screen flow**: Command Center > Kagenti Agents tab > "Create Agent" button > `KagentiCreateAgentWizard`

| Step | Screen                       | Component                      | What happens                                                      |
| ---- | ---------------------------- | ------------------------------ | ----------------------------------------------------------------- |
| 1    | Kagenti Agents tab           | `KagentiAgentsTab.tsx`         | Shows agents from Kagenti API. "Create Agent" button opens wizard |
| 2    | Wizard Step 1: Basic Info    | `KagentiCreateAgentWizard.tsx` | Name, namespace, framework, protocol                              |
| 3    | Wizard Step 2: Source        | Same                           | Git URL, branch, path OR container image                          |
| 4    | Wizard Step 3: Config        | Same                           | Env vars, ports, auth settings                                    |
| 5    | Wizard Step 4: Review        | Same                           | Summary, submit                                                   |
| 6    | **POST to Kagenti API**      | Backend `kagentiRoutes.ts`     | Calls `POST /api/v1/agents` on Kagenti                            |
| 7    | Agent appears in Kagenti tab |                                | Status shows as building/deploying                                |

**Bug**: After Kagenti creates the agent, no `chatAgents` entry is added to the admin config. This means the agent is invisible to the lifecycle system (draft/review/staging/production).

### Journey B: Create Agent via Admin Config

**Screen flow**: Command Center > Agents tab > Manage Agents > Add/Edit in config

| Step | Screen                       | What happens                                            |
| ---- | ---------------------------- | ------------------------------------------------------- |
| 1    | Agents tab                   | `AgentsPanel.tsx` shows agents from `chatAgents` config |
| 2    | Admin clicks "Manage Agents" | Opens config editor for `chatAgents` array              |
| 3    | Edit JSON/YAML               | Directly add agent entry with lifecycle: "draft"        |
| 4    | Save config                  | PUT `/admin/config/agents`                              |
| 5    | Agent appears in list        | With lifecycle state "draft"                            |

**Bug**: No integration with Kagenti. The chatAgents config entry has no link to a real running agent.

### Journey C: Create Agent via `AgentCreationWizard` (orphan)

The `AgentCreationWizard` component exists but appears to be disconnected from the routing. It was likely an older implementation that was superseded by the Kagenti wizard.

### Journey D: Submit Agent for Review

**Expected flow**: Agent in "draft" state > Click "Submit for Review" > State changes to "review"

| Step | What should happen        | What actually happens                                                       |
| ---- | ------------------------- | --------------------------------------------------------------------------- |
| 1    | Open agent detail         | Only works for chatAgents-based agents. Kagenti agents may not be clickable |
| 2    | Click "Submit for Review" | Calls `PUT /agents/:id/promote` with target "review"                        |
| 3    | isValidTransition check   | Should enforce draft→review only                                            |
| 4    | **BUG**                   | Kagenti agents don't have chatAgents entries, so they can't be submitted    |

### Journey E: Browse & Use Agents

**Screen flow**: Welcome Screen > Featured Agents / "Browse All Agents"

| Step | Screen             | What happens                                |
| ---- | ------------------ | ------------------------------------------- |
| 1    | Welcome Screen     | `FeaturedAgents.tsx` shows published agents |
| 2    | Click "Browse All" | `AgentCatalogDialog.tsx` opens              |
| 3    | Click agent        | Opens chat with agent                       |

**Bug**: Some agents in the catalog are not clickable. Format mismatch between `namespace/name` (Kagenti) and plain `id` (config) identifiers.

### Journey F: View "My Agents"

**Expected**: Show only agents created by the current user
**Actual**: Shows all agents (no `createdBy` field exists)

---

## 4. Identified Bugs (Priority Order)

### BUG-1 (P0): No delete for draft agents

- **Where**: Agent detail view, admin panel
- **What**: Once an agent is created as a draft, there is no UI button or backend route to delete it
- **Kagenti API**: `DELETE /api/v1/agents/{ns}/{name}` exists and works
- **Fix**: Add `DELETE /agents/:id` route in augment-backend + UI button in agent detail

### BUG-2 (P0): Kagenti agents not synced to chatAgents config

- **Where**: `kagentiRoutes.ts` POST handler
- **What**: After `POST /api/v1/agents` succeeds, no `chatAgents` entry is created. This means:
  - Agent is invisible to lifecycle stepper
  - Can't submit for review
  - Can't promote through lifecycle
- **Fix**: Auto-create `chatAgents` entry when Kagenti deploy succeeds

### BUG-3 (P0): Non-clickable agents in registry

- **Where**: `AgentCatalogDialog.tsx`, `AgentsPanel.tsx`
- **What**: Agents with `namespace/name` format IDs (from Kagenti) don't match the click handler that expects plain IDs
- **Fix**: Handle both ID formats in navigation/selection

### BUG-4 (P1): "My Agents" shows all agents

- **Where**: `AgentsPanel.tsx` "My Agents" tab
- **What**: No `createdBy` field on agent records. All agents shown to all users.
- **Fix**: Add `createdBy` field at creation time, filter in UI

### BUG-5 (P1): Publish/unpublish bypasses lifecycle validation

- **Where**: `agentRoutes.ts` publish/unpublish endpoints
- **What**: Direct publish jumps from any state to "production", bypassing `isValidTransition`
- **Fix**: Remove or gate these shortcuts

### BUG-6 (P2): Docs still reference 3-stage lifecycle

- **Where**: `docsContent.ts`
- **What**: Documentation references old 3-stage model (draft/active/inactive) instead of current 5-stage (draft/review/staging/production/retired)
- **Fix**: Update docs content

### BUG-7 (P2): Orphan `AgentCreationWizard` component

- **Where**: `src/components/AgentCreation/` or similar
- **What**: Older wizard component not connected to routes
- **Fix**: Remove or wire it

---

## 5. To-Be User Journey (Target State)

### Provider Journey (Agent Creator)

```
┌──────────┐    ┌───────────┐    ┌────────────┐    ┌───────────┐    ┌──────────────┐
│  CREATE   │───▶│   DRAFT   │───▶│   REVIEW   │───▶│  STAGING  │───▶│  PRODUCTION  │
│  (Wizard) │    │           │    │            │    │           │    │              │
└──────────┘    └─────┬─────┘    └─────┬──────┘    └─────┬─────┘    └──────┬───────┘
                      │                │                  │                 │
                      ▼                ▼                  ▼                 ▼
                   [Delete]      [Approve/Reject]    [Test/Verify]     [Retire]
                                      │                  │                 │
                                      ▼                  ▼                 ▼
                                 [Back to Draft]    [Back to Review]   [RETIRED]
```

#### Step-by-step:

1. **Create**: Provider uses Kagenti wizard OR admin config
   - Kagenti wizard: Creates K8s deployment + auto-creates chatAgents entry with `lifecycle: "draft"`
   - Config: Directly adds chatAgents entry
   - In both cases, `createdBy` is set to current user identity

2. **Draft**: Agent visible only to creator in "My Agents"
   - Can edit configuration
   - Can delete (removes from Kagenti + chatAgents)
   - Can test via inline chat
   - Click "Submit for Review" → moves to `review`

3. **Review**: Agent visible to admins in "Review Queue"
   - Admin reviews agent card, configuration, test results
   - Admin approves → moves to `staging`
   - Admin rejects → moves back to `draft` with feedback

4. **Staging**: Agent deployed in staging environment
   - Automated or manual testing
   - Admin promotes → moves to `production`
   - Issues found → moves back to `review`

5. **Production**: Agent visible in catalog to all consumers
   - Appears in Welcome Screen featured agents
   - Appears in Agent Catalog Dialog
   - Can be retired by admin → moves to `retired`

6. **Retired**: Agent hidden from catalog, preserved for audit
   - Can be reactivated → moves back to `staging`

### Consumer Journey (Agent User)

1. **Discover**: Browse agent catalog (Welcome Screen or Command Center)
2. **Select**: Click agent → opens chat interface
3. **Use**: Interact with agent via A2A protocol
4. **Rate/Report**: Provide feedback (future)

---

## 6. Gap Analysis: As-Is vs To-Be

| Area                            | As-Is               | To-Be                     | Gap                           | PR    |
| ------------------------------- | ------------------- | ------------------------- | ----------------------------- | ----- |
| Kagenti agent → chatAgents sync | Not synced          | Auto-sync on deploy       | Auto-create chatAgents entry  | PR 4  |
| Delete draft agents             | No delete option    | UI button + backend route | Add DELETE route + UI         | PR 2  |
| Agent clickability in registry  | Some not clickable  | All clickable             | Handle both ID formats        | PR 3  |
| "My Agents" scoping             | Shows all agents    | Shows only user's agents  | Add createdBy field           | PR 5  |
| Lifecycle validation            | Shortcuts bypass it | All transitions validated | Remove shortcuts              | PR 6  |
| Workflow agent sync             | Not wired           | Auto-sync on publish      | Wire syncWorkflowToChatAgents | PR 7  |
| Documentation                   | 3-stage model       | 5-stage model             | Update docsContent.ts         | PR 8  |
| Orphan wizard                   | Disconnected        | Removed or connected      | Clean up                      | PR 10 |

---

## 7. Orchestrator Integration Notes

### Cluster Infrastructure

The cluster has:

- **SonataFlow platform** in `sonataflow-infra` namespace
- **Orchestrator plugin** installed in RHDH (`red-hat-developer-hub-backstage-plugin-orchestrator`)
- **MCP extras** for orchestrator custom actions
- DataIndex service at `http://sonataflow-platform-data-index-service.sonataflow-infra.svc.cluster.local`

### RHDH Serverless Workflows Research

Analyzed the [rhdhorchestrator/serverless-workflows](https://github.com/rhdhorchestrator/serverless-workflows) repository to identify reusable approval patterns. Two workflows are most relevant:

#### Escalation Workflow (`ticketEscalation.sw.yaml`) — Most Reusable

The escalation workflow demonstrates the canonical approval pattern for RHDH:

1. **Create ticket** via a subflow (ticketing service abstraction)
2. **Wait for approval event** using a `callback` state with `eventRef: approvalEvent`
3. **Timeout → Escalate** — if no approval within the timeout (PT10S), send a broadcast notification via the RHDH notifications API and re-poll
4. **Approval → Execute** — on approval, proceed to the action (e.g., create K8s namespace)

Key patterns:

- Uses **event-driven callbacks** (`type: callback`) rather than polling — cleaner for real-time approvals
- Integrates with **RHDH Notifications API** (`notifications#createNotification`) for user-facing alerts
- Has a **timeout/escalation** loop that prevents approvals from being forgotten
- SonataFlow `specVersion: 0.8` compatible

#### Create OCP Project (`create-ocp-project.sw.yaml`) — Jira-Based Alternative

This workflow uses a **Jira polling** pattern for approvals:

1. Create audit Jira ticket + operations approval ticket
2. **Notify Backstage** via notifications API with link to Jira ticket
3. **Poll Jira** every 60s (`sleep.before: PT60S`) checking `status.statusCategory.key == "done"`
4. Branch on resolution: `Done` → create resource, anything else → denied
5. Close audit ticket with result

Key patterns:

- Uses **Jira as the approval system** — good for teams already using Jira for governance
- Polling-based rather than event-driven — simpler but higher latency
- Includes **audit trail** via Jira tickets with workflow instance ID labels
- Uses **RHDH Notifications API** for progress updates

### Recommended Approach for Agent Lifecycle Approvals

For the `review → staging` transition (admin approval), the **escalation pattern** is recommended:

```yaml
# Conceptual agent-approval.sw.yaml
id: agent-lifecycle-approval
specVersion: '0.8'
start: NotifyReviewers
states:
  - name: NotifyReviewers
    type: operation
    actions:
      - functionRef:
          refName: createNotification
          arguments:
            recipients:
              type: 'entity'
              entityRef: .adminGroup
            payload:
              title: '"Agent review requested: " + .agentId'
              description: .agentDescription
              topic: 'Agent Lifecycle'
              link: '"<backstage-url>/augment/admin/agents/" + .agentId'
              severity: 'normal'
    transition: WaitForApproval
  - name: WaitForApproval
    type: callback
    eventRef: agentApprovalEvent
    timeouts:
      eventTimeout: PT24H
    onErrors:
      - errorRef: timeoutError
        transition: Escalate
    transition: ApproveAgent
  - name: Escalate
    type: operation
    actions:
      - functionRef:
          refName: createNotification
          arguments:
            recipients:
              type: 'broadcast'
            payload:
              title: '"ESCALATION: Agent approval pending for " + .agentId'
              severity: 'high'
    transition: WaitForApproval
  - name: ApproveAgent
    type: operation
    actions:
      - functionRef:
          refName: promoteAgent
          arguments:
            agentId: .agentId
            targetStage: 'staging'
    end: true
```

### Integration Points

To wire this into the augment plugin:

1. **Trigger**: When `promote(agentId, 'review')` is called, start the SonataFlow workflow via the orchestrator API
2. **Callback**: Admin approves via the RHDH notification action → fires the `agentApprovalEvent`
3. **Action**: The workflow calls back to `PUT /agents/:id/promote` to advance to staging
4. **Fallback**: If the orchestrator is not available, fall back to direct promotion (current behavior)

### Prerequisites

- SonataFlow workflow must be deployed to the `sonataflow-infra` namespace
- A custom function definition (`promoteAgent`) must call the augment backend API
- The RHDH Notifications API must be accessible from SonataFlow
- An event listener must translate RHDH notification actions into SonataFlow events

---

## 8. PR Breakdown

| PR    | Title                                          | Priority | Dependencies |
| ----- | ---------------------------------------------- | -------- | ------------ |
| PR 2  | Add DELETE route + UI for draft agents         | P0       | None         |
| PR 3  | Fix non-clickable agents in registry           | P0       | None         |
| PR 4  | Auto-create chatAgents entry on Kagenti deploy | P0       | None         |
| PR 5  | Add createdBy field and scope My Agents        | P1       | PR 4         |
| PR 6  | Remove lifecycle-bypassing shortcuts           | P1       | None         |
| PR 7  | Wire syncWorkflowToChatAgents on publish       | P1       | PR 4         |
| PR 8  | Update docs to 5-stage lifecycle               | P2       | None         |
| PR 9  | Research RHDH orchestrator for approvals       | P2       | None         |
| PR 10 | Remove orphan AgentCreationWizard              | P2       | None         |
