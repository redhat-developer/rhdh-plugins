# Augment Plugin: Complete Feature Spec

Reference document for all features implemented between Thursday May 21 evening and Saturday May 23 end of day, when 35/35 E2E tests passed and skills agents were deploying to the OpenShift cluster. This is the target state to restore.

Branch: `feat/augment-phase-c-approval`
Baseline: `b4184482` (PR #3228 merged -- Phases A, B, H done)

---

## Table of Contents

1. [Agent Creation UX](#1-agent-creation-ux)
2. [Skills-Based Agent Creation](#2-skills-based-agent-creation)
3. [Approval Workflow (Dual-Mode)](#3-approval-workflow-dual-mode)
4. [Agent Lifecycle](#4-agent-lifecycle)
5. [Chat and Streaming](#5-chat-and-streaming)
6. [DevSpaces Integration](#6-devspaces-integration)
7. [Kagenti Integration](#7-kagenti-integration)
8. [Terminology and Labeling](#8-terminology-and-labeling)
9. [Bug Fixes Catalog](#9-bug-fixes-catalog)
10. [35/35 Test Suite](#10-3535-test-suite)
11. [Design System](#11-design-system)
12. [Backend API Reference](#12-backend-api-reference)
13. [Remaining Gaps](#13-remaining-gaps)

---

## 1. Agent Creation UX

### AgentCreateIntentDialog

**File:** `plugins/augment/src/components/AdminPanels/KagentiPanels/AgentCreateIntentDialog.tsx`

**Dialog:** MUI Dialog, maxWidth="md", fullWidth, borderRadius: 3.

**Top-level view -- "New Agent":**

- Title: "New Agent"
- Subtitle: "Choose how you want to get started with your new agent."
- Layout: 2-column grid (repeat(2, 1fr), gap 2.5)

| Card         | Icon                    | Accent Color                 | Gradient | Subtitle                                                                          | onClick                 |
| ------------ | ----------------------- | ---------------------------- | -------- | --------------------------------------------------------------------------------- | ----------------------- |
| Create Agent | AddCircleOutlineIcon    | `theme.palette.primary.main` | Yes      | "Build a new agent from scratch using skills, visual canvas, code, or templates." | Shows sub-options       |
| BYO Agent    | CloudUploadOutlinedIcon | `theme.palette.warning.dark` | No       | "Import an existing agent from a container image or Git repository."              | Opens CreateAgentWizard |

**AccentCard component styling:**

- Background: `glassSurface(theme, 6, isDark ? 0.5 : 0.75)`
- Animation: `fadeSlideIn` with `staggerDelay(animIndex, 60)`
- Padding: `p: 3`
- Border radius: `borderRadius.lg` (16px)
- Top accent: `borderTop: 3px solid ${accentColor}`
- Gradient variant: `linear-gradient(135deg, alpha(accent, 0.06-0.12) 0%, paper 60%)`
- Icon box: 48x48, borderRadius.md, bgcolor alpha(accent, 0.08-0.15), icon 26px
- Title: sectionTitle scale (1rem, weight 700)
- Subtitle: bodySmall scale, text.secondary
- Hover: `translateY(-3px) scale(1.01)`, accent box-shadow
- Focus: 2px solid accentColor outline
- Reduced motion: respects prefers-reduced-motion

**Sub-options view -- "Create Agent":**

- Title: "Create Agent", subtitle: "Pick a creation method."
- Back arrow returns to top-level
- 2x2 grid of AccentCards

| Sub-option                | Icon                           | Color                                 | Subtitle                                        | onClick                              |
| ------------------------- | ------------------------------ | ------------------------------------- | ----------------------------------------------- | ------------------------------------ |
| Create using Skills       | ExtensionOutlinedIcon          | `theme.palette.success.main` (green)  | "Compose an agent from reusable skills"         | Opens 3-step skills wizard           |
| Create with Visual Canvas | DashboardCustomizeOutlinedIcon | `theme.palette.info.dark` (purple)    | "Design with the no-code workflow builder"      | Closes dialog, opens WorkflowBuilder |
| Code Your Agent           | CodeIcon                       | `theme.palette.primary.dark` (blue)   | "Scaffold from a template or cloud workspace"   | Shows DevSpacesLaunchForm            |
| Create from Template      | DescriptionOutlinedIcon        | `theme.palette.warning.main` (orange) | "Start from a pre-configured software template" | Shows AgentTemplateBrowser           |

**No "Recommended" badge on any option.**

### Creation Path Journeys

**All paths must end on My Agents tab with a success toast.**

**Path 1 -- Create using Skills (3-step wizard inside dialog):**

1. RuntimePicker (choose runtime) -> 2. SkillBrowser (select skills) -> 3. SkillAgentConfigForm (name, prompt, deploy)

- On deploy success: `onCreated()` -> `handleIntentCreated` -> dialog closes, `marketplaceRefreshKey++`, `switchToMyAgents++`, 300ms delayed toast: "Agent created successfully! It will appear in your agents list."

**Path 2 -- Create with Visual Canvas:**

- Dialog closes, WorkflowBuilder opens
- After publish: builder closes, marketplace opens on My Agents tab
- `setShowWorkflowBuilder(false)`, `setShowMarketplace(true)`, `setSwitchToMyAgents(k => k + 1)`

**Path 3 -- Code Your Agent:**

- Shows DevSpacesFrameworkPicker -> DevSpacesLaunchForm (pre-filled git repo)
- After workspace Running: "Done" button calls `onDone` (closes dialog)
- Instructions: "Once your image is ready, return to the Augment marketplace and use BYO Agent to register and deploy it."
- NamespacePicker removed; namespace auto-derived from user identity

**Path 4 -- Create from Template:**

- Shows AgentTemplateBrowser inside dialog
- `handleLaunch` uses `window.open(url, '_blank', 'noopener')` (new tab)
- Calls `onDone()` to close dialog -- user stays on Augment

**Path 5 -- BYO Agent:**

- Opens CreateAgentWizard (import flow)
- Steps: Basics -> Deployment (image/git) -> Runtime -> Review
- `POST /kagenti/agents` -> auto-register in chatAgents as draft
- Success: `justCreatedRef` suppresses dialog reopen, refresh + switch to My Agents

### ChatView Wiring

**File:** `plugins/augment/src/components/AugmentPage/ChatView.tsx`

```
handleCloseIntentDialog:
  setIntentDialogOpen(false)
  setMarketplaceRefreshKey(k => k + 1)
  setSwitchToMyAgents(k => k + 1)

handleIntentCreated:
  setIntentDialogOpen(false)
  setMarketplaceRefreshKey(k => k + 1)
  setSwitchToMyAgents(k => k + 1)
  setTimeout(() => setCreateSuccess('Agent created successfully!...'), 300)

handleAgentDetail(agentId, framework?):
  if agentId has '/' and framework !== 'workflow-builder': Kagenti detail
  else: WorkflowAgentDetail (handles skill + workflow agents)
```

Props on AgentCreateIntentDialog: `open, onClose, onSelectDeploy, onSelectConfigure, onCreated`

### MarketplacePage Wiring

**File:** `plugins/augment/src/components/Marketplace/MarketplacePage.tsx`

**My Agents filter:**

```
agents.filter(a =>
  a.createdBy === userRef ||
  (a.governanceRegistered && (a.framework === 'workflow-builder' || a.framework === 'docsclaw')) ||
  (!a.governanceRegistered && a.lifecycleStage !== 'published')
)
```

**onAgentDetail signature:** `(agentId: string, framework?: string) => void`

- Must pass framework: `onAgentDetail(id, agent?.framework)`

**switchToMyAgentsKey:** When key changes, `setActiveTab('my-agents')`.

---

## 2. Skills-Based Agent Creation

### Skills Marketplace Config

**In `app-config.yaml`:**

```yaml
augment:
  skillsMarketplace:
    baseUrl: https://backstage-developer-hub-rhdh.apps.cluster-6crhb.6crhb.sandbox1011.opentlc.com/api/skill-marketplace
    agentImage: ghcr.io/redhat-et/docsclaw:latest
    advisorUrl: https://skill-advisor-smp-agents.apps.cluster-6crhb.6crhb.sandbox1011.opentlc.com
    llmBaseUrl: https://llamastack-llamastack.apps.cluster-6crhb.6crhb.sandbox1011.opentlc.com/v1
    llmModel: gemini/models/gemini-2.5-pro
    runtimes:
      - id: docsclaw
        name: DocsClaw
        description: ConfigMap-driven agentic runtime
        image: ghcr.io/redhat-et/docsclaw:latest
        language: Go
        footprint: ~10 MiB per pod
        features: [tool-use, a2a-protocol, skill-discovery, multi-provider]
        status: available
      - id: zeroclaw
        name: ZeroClaw
        description: Provider-agnostic agent runtime with 30+ channels
        image: ghcr.io/pavelanni/zeroclaw:0.7.0-beta-minimal
        language: Rust
        footprint: ~5 MiB per pod
        features: [multi-channel, a2a-protocol, rust-native]
        status: available
      - id: openfang
        name: OpenFang
        description: Agent operating system built in Rust
        language: Rust
        features: [agent-os, autonomous, rust-native]
        status: coming-soon
```

**Must be declared in `config.d.ts`** (TypeScript schema).

### RuntimePicker Component

**File:** `plugins/augment/src/components/SkillsAgentCreation/RuntimePicker.tsx` (163 lines)
**Fetches:** `GET /augment/skills/runtimes`
**Layout:** `Box display="flex" flexWrap="wrap" gap={2}`

- Each runtime: MUI Card variant="outlined", width 280px
- Available: clickable, full opacity; selected: 2px solid primary.main border
- Coming Soon: opacity 0.5, CardActionArea disabled
- Content: Name (subtitle1, weight 600) + status Chip (success/default) + description (body2) + language/footprint (caption) + feature chips (small, outlined)

### SkillBrowser Component

**File:** `plugins/augment/src/components/SkillsAgentCreation/SkillBrowser.tsx` (187 lines)
**Fetches:** `GET /augment/skills`

- Search: TextField placeholder="Search skills...", size="small", fullWidth
- Domain tabs: MUI Tabs variant="scrollable", first tab "All", domains sorted with localeCompare('en-US')
- Skill list: Box maxHeight 360, overflowY auto
- Each skill: FormControlLabel + Checkbox size="small"
- Label: name (body2, weight 500) + description (caption, text.secondary)
- Selection: string[] of skill names, toggle on click

### SkillAgentConfigForm Component

**File:** `plugins/augment/src/components/SkillsAgentCreation/SkillAgentConfigForm.tsx` (98 lines)

- Agent Name: TextField required, placeholder "my-skill-agent"
- System Prompt: TextField multiline, minRows 3, maxRows 8
- Runtime: TextField readOnly (selected runtimeId)
- Selected Skills: TextField readOnly ("N skills selected")
- Deploy button: Button variant="contained", "Deploy Agent" / "Deploying..."
- Calls `onDeploy({ name, systemPrompt })` which triggers parent's `handleSkillsDeploy`

### handleSkillsDeploy (in AgentCreateIntentDialog)

```
POST /augment/agents/from-skills
Headers: Content-Type: application/json, X-Backstage-Request: augment
Body: { name, systemPrompt, runtime: skillsRuntimeId, skills: skillsSelected }
On success: onCreated() then handleClose()
```

### Backend: POST /agents/from-skills

**File:** `plugins/augment-backend/src/routes/skillsRoutes.ts`

1. Validate agentName + 1+ skills
2. Read `agentImage` from config (default: `ghcr.io/redhat-et/docsclaw:latest`)
3. Derive namespace: `{username}-agents` from userRef
4. Call `generateSkillAgentManifests()` from `skillsManifestBuilder.ts`
5. Auto-create namespace if needed
6. Auto-create `llm-secret` if missing (LLM_PROVIDER, LLM_API_KEY, LLM_BASE_URL, LLM_MODEL)
7. Apply K8s manifests (ConfigMap, Deployment, Service) via K8s API
8. Call `registerSkillAgent()` to write governance entry to chatAgents

**CRITICAL:** `router.ts` must pass `adminConfig` to `registerSkillsRoutes()` for step 8 to work.

### K8s Manifest Generation

**File:** `plugins/augment-backend/src/routes/skillsManifestBuilder.ts`

**ConfigMap:** system-prompt.txt + agent-config.yaml (tools, exec timeout, loop max_iterations: 10)

**Deployment:** DocsClaw container + init containers:

- DocsClaw args: `serve --config-dir /config/agent --skills-dir /skills --listen-plain-http`
- One init container per skill: `alpine:3.20` fetches OCI layer blob via wget from quay.io V2 registry API, extracts with `tar xzf` into `/skills/{name}/`
- Shared emptyDir volume between init containers and DocsClaw
- Why init containers: K8s `image:` volume type doesn't extract on OpenShift 4.20

**Service:** ports 8000 (HTTP) + 8100 (health)

**LLM Secret:** LLM*PROVIDER=openai, LLM_API_KEY=not-needed, LLM_BASE_URL, LLM_MODEL (DocsClaw uses LLM*\_ not OPENAI\_\_)

### Governance Registration

**`registerSkillAgent()`** writes to chatAgents admin config:

- `framework: 'docsclaw'` (runtime name, not "skills")
- `chatEndpoint: http://{name}.{namespace}.svc:8000`
- `namespace`, `createdBy`, `lifecycleStage: 'draft'`

**`buildUnifiedAgentList()`** governance-only loop: iterates chatAgents, skips IDs in `seen`, pushes synthetic ChatAgent entries for skill-only agents:

- `providerType: 'augment'`, `source: 'skills'`, `framework` from stored config
- Detects skill agents: `storedFramework === 'docsclaw'` || `hasChatEndpoint`
- Non-skill governance entries: `providerType: 'orchestration'`, framework from ID prefix

**`overlayConfig()`** must copy `pendingAction` and `chatEndpoint` from ChatAgentConfig.

### Skill Agent Detail View

**File:** `plugins/augment/src/components/AdminPanels/KagentiPanels/WorkflowAgentDetail.tsx`

For `framework === 'docsclaw'`:

- Header badge: "Skill Agent"
- Type: "Skill Agent (DocsClaw Runtime)"
- Endpoint URL: shows chatEndpoint (e.g. `http://doc-agent.guest-agents.svc:8000`)
- Model: from live pod `/v1/models` (e.g. "docsclaw backed by gemini/models/gemini-2.5-pro")
- Inline test chat via skill chat proxy

### K8s Cleanup on Delete

In DELETE handler of `agentRoutes.ts`:

- Detect skill agents via `source === 'skills'` or `chatEndpoint` presence
- Fetch `devSpacesApiUrl` + `devSpacesToken` from adminConfig
- Delete: Deployment (`apps/v1`), Service (`v1`), ConfigMap (`v1/{name}-config`)
- Use `undici.Agent` with `rejectUnauthorized: false`

---

## 3. Approval Workflow (Dual-Mode)

### AgentApprovalWorkflowService

**File:** `plugins/augment-backend/src/services/AgentApprovalWorkflowService.ts`

**Config:**

```yaml
augment:
  agentApproval:
    enabled: true/false
    serviceUrl: http://sonataflow.sonataflow-infra.svc:8080
    workflowId: agentApproval
```

**Methods:**

- `startWorkflow({ agentId, agentName, submittedBy, agentSource })` -> returns instanceId
- `sendDecision({ instanceId, approved, decidedBy, reason? })` -> sends CloudEvent
- `cancelWorkflow(instanceId)` -> cancels running instance

### Built-in Mode (enabled: false)

All transitions happen immediately. No workflow instance IDs. Default for local dev.

### SonataFlow Mode (enabled: true)

**Promote (draft -> pending):**

- Call `approvalService.startWorkflow({ action: 'publish' })`
- Set `pendingAction: 'publish'` on config entry
- Persist `approvalWorkflowInstanceId`

**Approve:**

- Call `approvalService.sendDecision({ approved: true })`
- SonataFlow callbacks RHDH with `X-Augment-Workflow-Callback: true`
- Backend applies `pending -> published`

**Reject:**

- Call `approvalService.sendDecision({ approved: false, reason })`
- Returns to draft, clears workflow fields

**GET /agents response includes:** `approvalMode: 'built-in' | 'workflow'`

### Request Unpublish

**Endpoint:** `PUT /agents/:agentId/request-unpublish`

- `published -> pending`, `pendingAction: 'unpublish'`
- Starts unpublish workflow if SonataFlow enabled

**Review Queue:**

- Approve unpublish: `pending(unpublish) -> draft` (removed from marketplace)
- Reject unpublish ("Keep Published"): `pending(unpublish) -> published`, pendingAction cleared

### Withdraw

**Endpoint:** `PUT /agents/:agentId/withdraw`

- `pending -> draft`, clears pendingAction and approvalWorkflowInstanceId
- Cancels running SonataFlow instance if any

---

## 4. Agent Lifecycle

### Stages

`draft | pending | published | archived`

### Transitions (7 valid)

| From      | To        | Action            | Label               |
| --------- | --------- | ----------------- | ------------------- |
| draft     | pending   | submit            | Submit for Review   |
| pending   | published | approve           | Approve and Publish |
| pending   | draft     | reject            | Reject              |
| pending   | draft     | withdraw          | Withdraw            |
| published | pending   | request-unpublish | Request Unpublish   |
| published | archived  | archive           | Archive             |
| archived  | draft     | reactivate        | Reactivate          |

### Legacy Stage Map

`registered/review/staging -> pending`, `deployed/production -> published`, `retired -> archived`

### Startup Reconciliation

On backend startup (async IIFE):

1. Call `provider.listAgents()` for all runtime agents
2. Load existing chatAgents configs
3. For each runtime agent NOT in chatAgents: auto-create entry with `lifecycleStage: 'draft'`
4. Save via `adminConfig.set('chatAgents', ...)`

### Source Counts

`buildUnifiedAgentList` returns `sources: { byo: number, workflowBuilder: number }` (not kagenti/orchestration).

### Developer Journey

- Create agent (any path) -> appears in My Agents as Draft
- Submit for Review (draft -> pending)
- Admin approves -> Published (appears in Explore marketplace)
- Can Withdraw while pending
- Can Request Unpublish when published (goes through approval)

### Admin Journey

- Review Queue shows agents in `pending` stage
- Approve publish: pending -> published
- Reject: pending -> draft (with reason)
- Approve unpublish: pending(unpublish) -> draft
- Reject unpublish: pending(unpublish) -> published

---

## 5. Chat and Streaming

### Skill Agent Chat Proxy

**File:** `plugins/augment-backend/src/routes/skillChatProxy.ts`

**CRITICAL: Must run BEFORE `resolveConversationId`** to avoid session-not-found errors.

**`trySkillChatProxy(req, res, adminConfig, logger)`:**

1. Load chatAgents from adminConfig
2. Find agent by model name matching agentId where chatEndpoint exists
3. POST to `{chatEndpoint}/v1/chat/completions` with `{ messages, stream: true }`
4. Translate SSE: `stream.started`, `stream.text.delta`, `stream.completed`, `stream.error`
5. `undici.Agent` with `rejectUnauthorized: false`
6. SseHeartbeat for keep-alive

**DocsClaw API:** POST `/v1/chat/completions` (OpenAI-compatible, NOT Responses API)

### Chat Architecture Fixes (from transcript)

- Real streaming via `WorkflowExecutor.executeStream()` (not fake SSE)
- Session persistence: `sessions.addMessage()` after workflow chat
- Kagenti streaming: switched InlineAgentChat to `POST /chat/stream` (SSE) since Kagenti agents are streaming-only

---

## 6. DevSpaces Integration

### Framework Picker

**New component:** `DevSpacesFrameworkPicker.tsx`

- Card grid: Google ADK, LangGraph, CrewAI, OpenAI Agents, DIY/Custom
- Popular badges on ADK and LangGraph
- DIY: dashed border
- Backend: `GET /devspaces/frameworks` from config

### DevSpacesLaunchForm Changes

- Remove NamespacePicker; show auto-derived namespace message
- Add `onDone` prop (distinct from `onBack`)
- "Done" button calls `onDone` (closes dialog); "Back" calls `onBack` (framework picker)
- Instructions reference "BYO Agent" for deployment step

### Auto-namespace

`resolveNamespaceForUser('user:default/jsmith')` -> `jsmith-devspaces`

- `ensureNamespace()` auto-creates via K8s API
- Routes call this instead of requiring explicit namespace

### TLS Fix

`DevSpacesService.fetchWithTimeout()` uses `undici.Agent({ connect: { rejectUnauthorized: false } })`

---

## 7. Kagenti Integration

### Config-Seeded Fallback

In `KagentiProvider.listAgents()`: when API returns 0 agents but `config.agents` is set (e.g. `['mortgage-ai/mortgage-ai-api', 'tr-agents/branch-monitor']`), discover via agent-card endpoints.

### Auth

`app-config.local.yaml` with direct Keycloak credentials (env var substitution unreliable under `yarn dev`):

```yaml
augment:
  kagenti:
    auth:
      tokenEndpoint: https://keycloak-keycloak.apps.cluster-6crhb.../realms/kagenti/protocol/openid-connect/token
      clientId: kagenti-api
      clientSecret: <direct value>
```

---

## 8. Terminology and Labeling

| Old                                     | New                                             |
| --------------------------------------- | ----------------------------------------------- |
| "Kagenti" (UI label)                    | Framework name (A2A, LangGraph, ADK) or "Agent" |
| "Orchestration"                         | "Workflow Builder"                              |
| "Kagenti Connection" tab                | "Agent Ops"                                     |
| Source column                           | "Type"                                          |
| sources.kagenti / sources.orchestration | sources.byo / sources.workflowBuilder           |
| framework: 'skills'                     | framework: 'docsclaw'                           |

**Framework colors** (`marketplace.constants.ts`):

- docsclaw: `#009596` (PatternFly Cyan), label "DocsClaw"
- LangGraph: `#8b5cf6`
- GoogleADK: `#3b82f6`
- llamastack: `#f59e0b`

**Lifecycle badges:**

- Draft: `#6b7280` (gray)
- Pending: `#3b82f6` (blue)
- Published: `#10b981` (green)
- Archived: `#ef4444` (red)

---

## 9. Bug Fixes Catalog

### 27 bugs fixed (Thu evening - Sat night)

**1. 403 CSRF (6+ reports, 4 fix iterations)**

- Root cause: Missing `X-Backstage-Request` header on mutating requests
- Fix: `addCsrfHeader()` in AugmentApi.fetchJson, chatEndpoints.ts, all authFetch calls
- Files: AugmentApi.ts, chatEndpoints.ts, ChatView.tsx

**2. EditorCanvas TypeError**

- Root cause: `initialEdges`/`initialNodes` undefined
- Fix: `?? []` null guards in useMemo hooks
- File: EditorCanvas.tsx

**3. PublishDialog TypeError**

- Root cause: `workflow.name.trim()` on undefined
- Fix: Null guards for workflow/name/nodes/edges
- File: PublishDialog.tsx

**4. My Agents empty (7+ reports, 6 fix iterations)**

- 4a: Agents went to Review Queue not My Agents (redesigned flow)
- 4b: chatAgents ID mismatch + filter too restrictive
- 4c: Guest mode identity filter returned empty
- 4d: "BIG HUGE BUG" -- filter still too restrictive async race
- 4e: Skill agent not appearing (missing governance registration + unified list loop + refresh)
- 4f: Kagenti auto-registered with null createdBy

**5. Chat "Access denied"**

- Same root cause as #1 (CSRF header)

**6. LlamaStack connection error**

- Fix: Configure remote LlamaStack URL in app-config + skipTlsVerify

**7. Command Center 500 on approve**

- Misleading -- 500 was from separate Keycloak call, promote succeeded

**8. Command Center TypeError**

- Root cause: Lifecycle rename missed in OpsOverview/ActivityFeed/ToolReviewQueue
- Fix: Updated LIFECYCLE_COLORS references

**9. Lifecycle stage mismatch crashes**

- Root cause: Mixed 3/5/4-stage values across codebase
- Fix: Coordinated rename to 4-stage + LEGACY_STAGE_MAP

**10. Backend 404 on startup**

- Fix: SQLite config in app-config.yaml (connection.directory)

**11. Keycloak/RHDH inaccessible**

- Not code bug -- expired browser session

**12. Chat "No response" -- Kagenti agents**

- Root cause: Kagenti agents are streaming-only; InlineAgentChat used non-streaming
- Fix: Switched to POST /chat/stream with SSE parsing

**13. Chat architecture (streaming, sessions, Keycloak 401)**

- Real streaming via WorkflowExecutor.executeStream()
- Session persistence after workflow chat
- app-config.local.yaml with direct Keycloak credentials

**14. Agent visibility UX bugs**

- Missing "Edit in Builder" button
- Delete shown for non-draft
- Archive/Reactivate not admin-gated

**15. DevSpaces TLS rejection**

- Fix: undici.Agent with rejectUnauthorized: false

**16. AgentTemplateBrowser crash (NotImplementedError)**

- Fix: try/catch around useApi(catalogApiRef)

**17. OCI image volumes empty**

- Root cause: K8s image volume type doesn't extract on OpenShift 4.20
- Fix: Init containers (alpine:3.20 + wget + tar)

**18. LLM provider not configured (DocsClaw)**

- Root cause: DocsClaw uses LLM*\* not OPENAI*\* env vars
- Fix: Updated secret template + auto-create llm-secret

**19. Chat "No response" -- Skill agents**

- Root cause: No chat proxy + routing to wrong detail view
- Fix: skillChatProxy.ts, chatRoutes.ts (before session resolution), ChatView routing

**20-27. Additional fixes:**

- Save lifecycle jumped to production -> preserves draft
- Editor breaks after save -> correct setActiveWorkflow
- WorkflowDashboard import error -> type rename
- Registry shows Submit to admin -> filtered PromotionActions
- Success toast not appearing -> 300ms setTimeout
- DevSpaces wrong instructions -> "BYO Agent" reference
- BYO Agent missing right arrow -> added matching arrow
- Creation paths don't switch to My Agents -> refresh + switch wiring

---

## 10. 35/35 Test Suite

**Peak: Saturday May 23, 12:59 PM. Methodology: curl against localhost:7007/api/augment.**

### Group 1: Agent Visibility (V1-V5)

- V1: GET /agents returns Kagenti + workflow agents (3+)
- V2: approvalMode: "built-in" present
- V3: Source labels correct (kagenti vs orchestration)
- V4: GET /agents?published=true filters correctly
- V5: GET /status includes approvalMode

### Group 2: Workflow Lifecycle (D1-D9)

- D1: Promote to pending
- D2: Verify pending + pendingAction: publish
- D3: Withdraw -> draft
- D4: Re-submit after withdraw
- D5: Admin approve -> published
- D6: Verify in published filter
- D7: Request unpublish -> pending + pendingAction: unpublish
- D8: Admin approve removal -> draft
- D9: Unpublish -> admin rejects -> stays published

### Group 3: Kagenti Lifecycle (K1-K6)

- K1: Kagenti agent exists with source: kagenti
- K2: Submit for review -> pending
- K3: Admin approve -> published
- K4: Streaming chat (SSE delta events)
- K5: Request unpublish -> pending
- K6: Admin approve removal -> draft

### Group 4: Admin Reject (R1-R3)

- R1: Submit then reject with reason
- R2: Rejection fields in GET /agents
- R3: Re-submit clears rejection fields

### Group 5: Governance Guards (G1-G8)

- G1: Direct config write with lifecycleStage -> 400
- G2: Direct config write with approvalWorkflowInstanceId -> 400
- G3: Non-admin promote pending->published -> 403
- G4: Non-admin delete published -> 403
- G5: Delete published without archive -> 400
- G6: Invalid transition draft->published -> 400
- G7: Withdraw non-pending -> 400
- G8: Request unpublish non-published -> 400

### Group 6: Chat (C1-C3)

- C1: Workflow agent streaming chat
- C2: Session persistence (messages survive reload)
- C3: Kagenti streaming chat

### Group 7: SonataFlow Mode (S1-S6)

- S1: approvalMode: "workflow"
- S2: Submit starts workflow (instanceId set)
- S3: Admin approve sends CloudEvent (workflowDecisionSent: true)
- S4: Withdraw with active workflow
- S5: Request unpublish starts workflow
- S6: Workflow failure handling (502)

### Group 8: Mode Switch (MS1-MS2)

- MS1: Submit in SonataFlow mode
- MS2: Switch to built-in, approve with stale instanceId

### Group 9: My Agents Filter (MA1-MA3)

- MA1: Unpublished Kagenti agents visible
- MA2: Published Kagenti excluded from filter
- MA3: Workflow-builder governanceRegistered agents visible

### Post-Peak Verification (Saturday afternoon-evening)

- DevSpaces workspace creation on cluster (Ready/Running)
- Framework picker with 5 cards
- Kagenti import wizard (21 fields validated)
- Skills marketplace (219 skills)
- DocsClaw deploy to cluster (doc-agent in guest-agents namespace)
- DocsClaw chat via LlamaStack + Gemini 2.5 Pro
- Jira tickets RHDHPLAN-1334, 1335, 1336

---

## 11. Design System

**File:** `plugins/augment/src/theme/tokens.ts`

### Spacing (MUI multipliers, 1 unit = 8px)

xxs: 0.5 (4px), xs: 1 (8px), sm: 1.5 (12px), md: 2 (16px), lg: 3 (24px), xl: 4 (32px), xxl: 6 (48px)

### Border Radius

xs: 0.5 (4px), sm: 1 (8px), md: 1.5 (12px), lg: 2 (16px), xl: 2.5 (20px), xxl: 3 (24px), pill: 9999px

### Typography Scale

- pageTitle: 1.25rem, weight 700, letter-spacing -0.01em
- sectionTitle: 1rem, weight 600, letter-spacing -0.005em
- body: 0.875rem, weight 400
- bodySmall: 0.8125rem
- caption: 0.75rem
- micro: 0.6875rem, weight 500
- code: 0.8125rem

### Font Families

- Primary: -apple-system, BlinkMacSystemFont, SF Pro, Helvetica Neue, Segoe UI, Roboto, sans-serif
- Mono: SF Mono, JetBrains Mono, Fira Code, Cascadia Code, Monaco, monospace

### Icon Sizes

xs: 14, sm: 16, md: 18, lg: 22, xl: 24

### Glass Surface

`glassSurface(theme, blur=12, opacity?)` -- backdrop-filter blur, theme-aware bg opacity

### Animations

- fadeSlideIn: translateY(4px) -> translateY(0), 0.3s ease-out
- staggerDelay(index, baseMs=50): each item delays index \* baseMs ms
- Reduced motion: respects prefers-reduced-motion
- Hover: translateY(-3px) scale(1.01) with accent box-shadow

### PatternFly Color Alignment

Colors come from `theme.palette.*` which maps to PatternFly in RHDH:

- primary.main -> PatternFly Blue #0066CC
- success.main -> PatternFly Green #3E8635
- info.dark -> PatternFly Purple
- warning.main -> PatternFly Orange #F0AB00

---

## 12. Backend API Reference

### Skills Endpoints

| Method | Path                        | Description                                       |
| ------ | --------------------------- | ------------------------------------------------- |
| GET    | /augment/skills             | Proxy to Skills Marketplace API                   |
| GET    | /augment/skills/runtimes    | Config-driven runtimes                            |
| GET    | /augment/skills/domains     | Unique domains from marketplace                   |
| POST   | /augment/agents/from-skills | Deploy skill agent (manifests + K8s + governance) |

### Agent Lifecycle Endpoints

| Method | Path                                  | Description                                |
| ------ | ------------------------------------- | ------------------------------------------ |
| GET    | /augment/agents                       | Unified agent list with approvalMode       |
| PUT    | /augment/agents/:id/promote           | Promote (with optional SonataFlow)         |
| PUT    | /augment/agents/:id/demote            | Demote                                     |
| PUT    | /augment/agents/:id/request-unpublish | Request unpublish (triggers approval)      |
| PUT    | /augment/agents/:id/withdraw          | Withdraw pending submission                |
| DELETE | /augment/agents/:id                   | Delete (with K8s cleanup for skill agents) |

### DevSpaces Endpoints

| Method | Path                          | Description                       |
| ------ | ----------------------------- | --------------------------------- |
| GET    | /augment/devspaces/health     | DevSpaces service health          |
| GET    | /augment/devspaces/frameworks | Configured frameworks             |
| POST   | /augment/devspaces/workspaces | Create workspace (auto-namespace) |
| GET    | /augment/devspaces/workspaces | List workspaces                   |

### Chat Endpoints

| Method | Path                 | Description                           |
| ------ | -------------------- | ------------------------------------- |
| POST   | /augment/chat        | Non-streaming chat                    |
| POST   | /augment/chat/stream | Streaming chat (SSE) with skill proxy |

---

## 13. Skills Marketplace Integration Guide

This section explains exactly how the augment plugin connects to the existing Skills Marketplace RHDH plugin so that skills appear in the UI browser.

### Architecture

```
Skills Marketplace (RHDH plugin on cluster)
  └── GET /api/skill-marketplace/skills  →  219 skills in Neo4j graph
  └── GET /api/skill-marketplace/domains
  └── GET /api/skill-marketplace/graph
  └── GET /api/skill-marketplace/bundles

Augment Backend (proxy)
  └── GET /augment/skills          →  proxies to marketplace baseUrl
  └── GET /augment/skills/runtimes →  from app-config.yaml
  └── GET /augment/skills/domains  →  derived from marketplace response

Augment Frontend
  └── SkillBrowser.tsx   →  fetches GET /augment/skills
  └── RuntimePicker.tsx  →  fetches GET /augment/skills/runtimes
```

### Config Required (`app-config.yaml`)

```yaml
augment:
  skillsMarketplace:
    baseUrl: https://backstage-developer-hub-rhdh.apps.cluster-6crhb.6crhb.sandbox1011.opentlc.com/api/skill-marketplace/skills
    agentImage: ghcr.io/redhat-et/docsclaw:latest
    advisorUrl: https://skill-advisor-smp-agents.apps.cluster-6crhb.6crhb.sandbox1011.opentlc.com
    llmBaseUrl: https://llamastack-llamastack.apps.cluster-6crhb.6crhb.sandbox1011.opentlc.com/v1
    llmModel: gemini/models/gemini-2.5-pro
    runtimes:
      - id: docsclaw
        name: DocsClaw
        description: ConfigMap-driven agentic runtime
        image: ghcr.io/redhat-et/docsclaw:latest
        language: Go
        footprint: ~10 MiB per pod
        features: [tool-use, a2a-protocol, skill-discovery, multi-provider]
        status: available
      - id: zeroclaw
        name: ZeroClaw
        description: Provider-agnostic agent runtime with 30+ channels
        image: ghcr.io/pavelanni/zeroclaw:0.7.0-beta-minimal
        language: Rust
        footprint: ~5 MiB per pod
        features: [multi-channel, a2a-protocol, rust-native]
        status: available
      - id: openfang
        name: OpenFang
        description: Agent operating system built in Rust
        language: Rust
        features: [agent-os, autonomous, rust-native]
        status: coming-soon
```

**IMPORTANT:** `baseUrl` must point to the `/skills` endpoint specifically (not just the plugin root), because `GET /augment/skills` fetches this URL directly.

### Skills Marketplace API Response Shape

The marketplace returns a JSON object. The backend proxy at `GET /augment/skills` fetches `skillsConfig.baseUrl` and returns the raw response.

**Actual response from cluster:**

```json
{
  "skills": [
    {
      "slug": "application-intake",
      "name": "Application Intake",
      "skillName": "application-intake",
      "description": "Automates the intake process for new applications...",
      "pluginName": "engineering",
      "tags": ["intake", "automation"],
      "lifecycleState": "published",
      "version": "1.0.0",
      "authors": ["platform-team"],
      "body": "# Application Intake\n\nThis skill...",
      "gitPath": "https://quay.io/rbrhssa/skills:application-intake-1.0.0-published"
    }
  ]
}
```

**Key fields:**

- `name`: Display name shown in SkillBrowser
- `description`: Shown below the name
- `pluginName`: Used as domain/category for domain filter tabs
- `gitPath`: OCI image reference (with `https://` prefix that must be stripped for K8s)
- `body`: Full SKILL.md content (available from API, no need to fetch from OCI separately)
- `lifecycleState`: "published" or "draft" (38 published, 181 draft out of 219)

### Frontend-Backend Data Flow Issue

**Current backend** (`skillsRoutes.ts` line 78): Returns `data` directly from marketplace -- `res.json(data)`. The marketplace returns `{ skills: [...] }`.

**Current frontend** (`SkillBrowser.tsx` line 66): Expects `{ skills?: SkillDefinition[] }` and reads `data.skills ?? []`.

**This works** because the marketplace wraps skills in a `{ skills: [...] }` envelope.

**Frontend SkillDefinition interface:**

```typescript
interface SkillDefinition {
  name: string;
  description?: string;
  domain?: string; // mapped from pluginName
  gitPath?: string; // OCI ref with https:// prefix
}
```

**Domain mapping issue:** The marketplace uses `pluginName` for categories, but SkillBrowser filters on `domain`. The backend proxy returns raw marketplace data where the field is `pluginName`, not `domain`. The SkillBrowser domain filter currently won't work because it checks `s.domain` but the data has `s.pluginName`.

**Fix needed in backend proxy** (`GET /augment/skills`): Normalize the response to map `pluginName` -> `domain`:

```typescript
const skills = (data.skills ?? []).map(s => ({
  ...s,
  domain: s.pluginName ?? s.domain,
}));
res.json({ skills, configured: true, total: skills.length });
```

Or fix in frontend by checking both: `s.domain ?? s.pluginName`.

### OCI Registry Flow (for deploy)

When a user creates a skill agent, each selected skill's OCI image must be mounted into the DocsClaw pod.

**Step 1: gitPath -> OCI ref:**
`https://quay.io/rbrhssa/skills:application-intake-1.0.0-published` -> `quay.io/rbrhssa/skills:application-intake-1.0.0-published`

**Step 2: Init container fetches the layer:**

```bash
# Parse registry, repo, tag from OCI ref
MANIFEST=$(wget -qO- "https://${registryHost}/v2/${repoPath}/manifests/${tag}" \
  --header="Accept: application/vnd.oci.image.manifest.v1+json")
DIGEST=$(echo "$MANIFEST" | grep -o '"sha256:[a-f0-9]*"' | tail -1 | tr -d '"')
wget -qO- "https://${registryHost}/v2/${repoPath}/blobs/$DIGEST" | tar xzf - -C /skills/${slug}/
```

**Step 3: DocsClaw reads skills:**
DocsClaw started with `--skills-dir /skills` reads `SKILL.md` + `skill.yaml` from each subdirectory.

### Two Skill Registries

| Registry                 | Skills                                          | Used for                       |
| ------------------------ | ----------------------------------------------- | ------------------------------ |
| `quay.io/rbrhssa/skills` | 219 marketplace skills                          | `gitPath` from marketplace API |
| `quay.io/skillimage/`    | Pavel's demo skills (document-summarizer, etc.) | Direct OCI refs                |

Both use the same OCI artifact format: a tar.gz layer containing `SKILL.md` + `skill.yaml`.

### Skills Marketplace A2A Agents (on cluster)

| Agent            | URL                                                       | Purpose                   | Integrated?              |
| ---------------- | --------------------------------------------------------- | ------------------------- | ------------------------ |
| skill-advisor    | `https://skill-advisor-smp-agents.apps.cluster-6crhb.../` | AI skill recommendations  | Config only (advisorUrl) |
| skill-builder    | `https://skill-builder-smp-agents.apps.cluster-6crhb.../` | Generate + publish skills | Not integrated           |
| bundle-validator | On cluster                                                | Validate skill bundles    | Not integrated           |
| kg-qa            | On cluster                                                | NL queries on skill graph | Not integrated           |
| playground       | On cluster                                                | Test skills interactively | Not integrated           |

### What Had to Change to Make It Work

1. **Discovery:** Probed cluster for existing skills infrastructure instead of building from scratch
2. **Proxy:** Backend proxies to marketplace because local dev can't reach cluster directly
3. **Domain mapping:** Marketplace uses `pluginName` for categories; frontend uses `domain`
4. **OCI image volumes failed:** K8s `image:` volume type doesn't extract on OpenShift 4.20 (ImageVolume feature gate not enabled) -- replaced with init containers
5. **Init container:** busybox doesn't support TLS to quay.io -- switched to `alpine:3.20`
6. **LLM env vars:** DocsClaw uses `LLM_*` not `OPENAI_*` -- secret template corrected
7. **LLM secret:** Must be auto-created in target namespace from app-config values
8. **Chat proxy:** DocsClaw exposes `/v1/chat/completions` (OpenAI-compatible), NOT Responses API -- chat must proxy to this endpoint before session resolution

---

## 14. Remaining Gaps (vs Saturday Night Target)

| #   | File                         | Gap                                                  | Size                        |
| --- | ---------------------------- | ---------------------------------------------------- | --------------------------- |
| 1   | router.ts                    | Pass adminConfig to registerSkillsRoutes             | 1 line                      |
| 2   | AgentCreateIntentDialog.tsx  | Deploy stub needs real API call                      | ~10 lines                   |
| 3   | agentRoutes.ts               | K8s DELETE cleanup for skill agents                  | ~30 lines                   |
| 4   | agentRoutes.ts               | Startup reconciliation                               | ~25 lines                   |
| 5   | agentRoutes.ts               | Source counts byo/workflowBuilder naming             | ~5 lines                    |
| 6   | ChatView.tsx                 | handleCloseIntentDialog refresh + switch             | Already done in uncommitted |
| 7   | ChatView.tsx                 | handleIntentCreated 300ms toast                      | Already done in uncommitted |
| 8   | MarketplacePage.tsx          | Pass framework in onAgentDetail                      | ~5 lines                    |
| 9   | DevSpacesLaunchForm.tsx      | Remove NamespacePicker, add onDone, BYO instructions | ~30 lines                   |
| 10  | AgentTemplateBrowser.tsx     | window.open instead of navigate                      | ~5 lines                    |
| 11  | DevSpacesFrameworkPicker.tsx | New component + backend endpoint                     | ~200 lines                  |
| 12  | config.d.ts                  | skillsMarketplace + devSpaces.frameworks schemas     | ~40 lines                   |
| 13  | InlineAgentChat.tsx          | Extract shared, remove duplicates                    | ~20 lines                   |

Estimated total: ~380 lines of targeted changes.
