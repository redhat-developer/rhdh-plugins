# Kagenti Feature Catalog

Complete inventory of every Kagenti feature available through the Augment RHDH plugin.

**Legend:**
- **Working** -- Backend route + frontend UI both exist and are wired
- **API-only** -- Backend route exists but no frontend UI
- **Untested** -- No automated tests cover this feature

---

## Persona 1: Chat User

Any authenticated user with `augment.access` permission when provider is `kagenti`.

### Agent Discovery and Selection

| # | Feature | Status | Conditions | Backend | Frontend |
|---|---------|--------|------------|---------|----------|
| 1 | Browse agent gallery | Working | Welcome screen, `isKagenti` | `GET /kagenti/agents` | `AgentGallery` |
| 2 | Search/filter agents | Working | Gallery open | Client-side | `AgentGallery` |
| 3 | Pin/unpin favorites | Working | Gallery open | localStorage | `usePinnedRecent` |
| 4 | Agent detail drawer | Working | Gallery open | `GET /kagenti/agents/:ns/:name` | `AgentDetailDrawer` |
| 5 | Select agent for chat | Working | Gallery open | Sets `model` state | `ChatContainer` |
| 6 | Agent chip in input | Working | Agent selected | N/A | `ChatInput` |
| 7 | Agent info sidebar | Working | Right pane open | `GET /kagenti/agents/:ns/:name` | `AgentInfoSection` |
| 8 | Dashboard links sidebar | Working | Config has URLs | `GET /kagenti/config/dashboards` | `AgentInfoSection` |

### Chat and Streaming

| # | Feature | Status | Conditions | Backend | Frontend |
|---|---------|--------|------------|---------|----------|
| 9 | Send message (streaming) | Working | Session exists | `POST /chat/stream` | `useStreamingChat` |
| 10 | Send message (non-streaming) | Working | Fallback path | `POST /chat` | `useStreamingChat` |
| 11 | Session auto-creation | Working | First message | `POST /sessions` | `useStreamingChat` |
| 12 | Session persistence | Working | DB available | `GET /sessions` | `useChatSessions` |
| 13 | Stop/cancel generation | Working | During stream | AbortController | `ChatContainer` |
| 14 | Regenerate message | Working | Has messages | Re-streams | `useChatActions` |
| 15 | Edit previous message | Working | Has messages | Re-streams | `useChatActions` |
| 16 | View reasoning steps | Working | Agent sends them | Stream events | `ReasoningDisplay` |
| 17 | View RAG sources | Working | RAG enabled | Stream events | Stream state |
| 18 | View tool calls | Working | Agent uses tools | Stream events | `ToolCallDisplay` |
| 19 | View artifacts | Working | Agent sends them | Stream events | `ArtifactRenderer` |
| 20 | View citations | Working | Agent sends them | Stream events | `CitationRenderer` |
| 21 | Multi-agent handoffs | Working | Multi-agent setup | Stream events | `HandoffDivider` |
| 22 | Conversation history | Working | DB + Kagenti contexts | Kagenti `/api/v1/contexts/:id/history` | Via `ConversationCapability` |
| 23 | Provider offline banner | Working | Status polling | `GET /status` | `ProviderOfflineBanner` |

### Human-in-the-Loop / A2A Interactive Flows

| # | Feature | Status | Conditions | Backend | Frontend |
|---|---------|--------|------------|---------|----------|
| 24 | Tool approval dialog | Working | Agent requests approval | `POST /chat/approve` | `ToolApprovalDialog` |
| 25 | Edit tool arguments | Working | Approval pending | Same | `ToolArgumentsEditor` |
| 26 | Reject with reason | Working | Approval pending | Same | `useToolApproval` |
| 27 | Form input card | Working | Agent sends form request | `POST /chat/approve` (form_response) | `FormRequestCard` |
| 28 | OAuth required card | Working | Agent requires OAuth | `POST /chat/approve` (oauth_confirm) | `AuthRequiredCard` |
| 29 | Secrets input card | Working | Agent requires secrets | `POST /chat/approve` (secrets_response) | `AuthRequiredCard` |
| 30 | Approval keyboard shortcuts | Working | Dialog open | N/A | `useApprovalKeyboardShortcuts` |
| 31 | Fallback on empty approval | Working | Approval succeeds | N/A | `ChatContainer` handlers |

### Namespace Context

| # | Feature | Status | Conditions | Backend | Frontend |
|---|---------|--------|------------|---------|----------|
| 32 | Namespace picker | Working | `isKagenti`, admin header | `GET /kagenti/namespaces` | `NamespacePicker` |
| 33 | Namespace persistence | Working | Always | sessionStorage | `AugmentPage` |
| 34 | Namespace allowlist | Working | Config `namespaces` set | `validateNamespaceParam` | Backend-only |

---

## Persona 2: Admin -- Agents and Tools

Requires `isAdmin` + admin view mode. Mutations gated by `requireAdminAccess`.

### Agent Management

| # | Feature | Status | Conditions | Backend | Frontend |
|---|---------|--------|------------|---------|----------|
| 35 | List agents | Working | Admin Kagenti tab | `GET /kagenti/agents` | `KagentiAgentsPanel` |
| 36 | Create agent | Working | Admin | `POST /kagenti/agents` | `KagentiAgentsPanel` |
| 37 | Delete agent | Working | Admin | `DELETE /kagenti/agents/:ns/:name` | `KagentiAgentsPanel` |
| 38 | View agent build info | Working | Admin | `GET /kagenti/agents/:ns/:name/build-info` | `KagentiAgentsPanel` |
| 39 | Trigger agent build | Working | Admin, Shipwright | `POST /kagenti/agents/:ns/:name/buildrun` | `KagentiAgentsPanel` |
| 40 | Agent migration | API-only | Admin | `POST /kagenti/agents/:ns/:name/migrate` | None |
| 41 | Bulk migration | API-only | Admin | `POST /kagenti/agents/migration/migrate-all` | None |

### Tool Management

| # | Feature | Status | Conditions | Backend | Frontend |
|---|---------|--------|------------|---------|----------|
| 42 | List tools | Working | Admin Kagenti tab | `GET /kagenti/tools` | `KagentiToolsPanel` |
| 43 | Create tool wizard | Working | Admin | `POST /kagenti/tools` | `CreateToolWizard` |
| 44 | Delete tool | Working | Admin | `DELETE /kagenti/tools/:ns/:name` | `KagentiToolsPanel` |
| 45 | Tool detail drawer | Working | Admin | `GET /kagenti/tools/:ns/:name` | `KagentiToolDetailDrawer` |
| 46 | Tool route status | Working | Admin | `GET /kagenti/tools/:ns/:name/route-status` | `KagentiToolDetailDrawer` |
| 47 | MCP tool discovery | Working | Admin | `POST /kagenti/tools/:ns/:name/connect` | `McpToolCatalog` |
| 48 | MCP tool invocation | Working | Admin | `POST /kagenti/tools/:ns/:name/invoke` | `McpToolCatalog` |
| 49 | Tool build info | Working | Admin | `GET /kagenti/tools/:ns/:name/build-info` | `KagentiToolDetailDrawer` |
| 50 | Trigger tool build | Working | Admin, Shipwright | `POST /kagenti/tools/:ns/:name/buildrun` | `KagentiToolDetailDrawer` |
| 51 | Finalize tool build | Working | Admin | `POST /kagenti/tools/:ns/:name/finalize-build` | `KagentiToolDetailDrawer` |

### Shipwright Build Pipeline

| # | Feature | Status | Conditions | Backend | Frontend |
|---|---------|--------|------------|---------|----------|
| 52 | List build strategies | Working | Admin | `GET /kagenti/agents/build-strategies` | `KagentiBuildPipelinePanel` |
| 53 | List Shipwright builds | Working | Admin | `GET /kagenti/shipwright/builds` | `KagentiBuildPipelinePanel` |
| 54 | Trigger build from list | Working | Admin | `POST /kagenti/agents/:ns/:name/buildrun` | `KagentiBuildPipelinePanel` |

---

## Persona 3: Admin -- Sandbox

Requires `isAdmin` + `sandbox` feature flag.

| # | Feature | Status | Conditions | Backend | Frontend |
|---|---------|--------|------------|---------|----------|
| 55 | List sandbox sessions | Working | `sandbox` flag | `GET /kagenti/sandbox/:ns/sessions` | `KagentiSandboxPanel` |
| 56 | Session token usage | Working | `sandbox` flag | `GET .../token-usage/sessions/:id` | `KagentiSandboxPanel` |
| 57 | Rename session | Working | `sandbox` flag | `PUT .../sessions/:id/rename` | `KagentiSandboxPanel` |
| 58 | Kill session | Working | `sandbox` flag | `POST .../sessions/:id/kill` | `KagentiSandboxPanel` |
| 59 | Approve/deny session | Working | `sandbox` flag, admin | `POST .../approve`, `POST .../deny` | `KagentiSandboxPanel` |
| 60 | Set session visibility | Working | `sandbox` flag | `PUT .../visibility` | `KagentiSandboxPanel` |
| 61 | List agents + pod status | Working | `sandbox` flag | `GET .../agents`, `.../pod-status` | `KagentiSandboxPanel` |
| 62 | Sandbox chat (non-streaming) | API-only | `sandbox` flag | `POST /kagenti/sandbox/:ns/chat` | None |
| 63 | Sandbox streaming chat | API-only | `sandbox` flag | `POST /kagenti/sandbox/:ns/chat/stream` | None |
| 64 | Session subscribe (SSE) | API-only | `sandbox` flag | `GET .../sessions/:id/subscribe` | None |
| 65 | Create/delete sandbox | API-only | `sandbox` flag, admin | `POST/DELETE /kagenti/sandbox/:ns/...` | None |
| 66 | Browse sandbox files | API-only | `sandbox` flag | `GET /kagenti/sandbox/:ns/files/...` | None |
| 67 | Sidecar management | API-only | `sandbox` flag | `POST .../sidecars/...` | None |
| 68 | Session chain/history | API-only | `sandbox` flag | `GET .../chain`, `GET .../history` | None |
| 69 | Cleanup sessions (TTL) | API-only | `sandbox` flag, admin | `POST /kagenti/sandbox/:ns/cleanup` | None |

---

## Persona 4: Admin -- Platform

Requires `isAdmin` + specific feature flags.

| # | Feature | Status | Flag | Backend | Frontend |
|---|---------|--------|------|---------|----------|
| 70 | View LLM models | Working | `sandbox` | `GET /kagenti/models` | `KagentiAdminPanel` |
| 71 | Create/list LLM teams | Working | `sandbox` | `POST/GET /kagenti/llm/teams` | `KagentiAdminPanel` |
| 72 | Create/list/delete API keys | Working | `sandbox` | `POST/GET/DELETE /kagenti/llm/keys` | `KagentiAdminPanel` |
| 73 | List integrations | Working | `integrations` | `GET /kagenti/integrations` | `KagentiAdminPanel` |
| 74 | Create integration | Working | `integrations` | `POST /kagenti/integrations` | `KagentiAdminPanel` |
| 75 | Test integration | Working | `integrations` | `POST .../test` | `KagentiAdminPanel` |
| 76 | Delete integration | Working | `integrations` | `DELETE .../integrations/:ns/:name` | `KagentiAdminPanel` |
| 77 | Update integration | API-only | `integrations` | `PUT .../integrations/:ns/:name` | None |
| 78 | Create trigger | Working | `triggers` | `POST /kagenti/sandbox/trigger` | `KagentiAdminPanel` |
| 79 | Dashboard link cards | Working | None | `GET /kagenti/config/dashboards` | `KagentiDashboardLinks` |
| 80 | Feature flag display | Working | None | `GET /kagenti/config/features` | `KagentiAdminPanel` |

---

## Test Coverage Summary

| Layer | Coverage | Notes |
|-------|----------|-------|
| Stream Normalizer | Strong (40 tests) | Pure unit tests |
| HTTP Clients (API/Admin/Sandbox) | Good (36 tests) | Real/mocked HTTP |
| KagentiProvider | Moderate (18 tests) | Mocked clients |
| Config Loader | Good (7 tests) | Real config reader |
| Keycloak Token Manager | Good (6 tests) | Real mini HTTP server |
| Express Routes | Moderate (33 tests) | Supertest; many routes untested |
| Frontend Kagenti UI | None | No Kagenti-specific frontend tests |
| E2E / Contract | None | Playwright stubbed but not implemented |

## Features Without UI (API-Only)

The following 9 features have backend routes and client support but no frontend UI:

1. **Agent migration** (#40) and **bulk migration** (#41)
2. **Sandbox chat** (#62), **streaming** (#63), and **session subscribe** (#64)
3. **Create/delete sandbox** (#65)
4. **Browse sandbox files** (#66)
5. **Sidecar management** (#67)
6. **Session chain/history** (#68)
7. **Update integration** (#77)

These can be accessed programmatically via the Augment backend REST API but are not exposed in the Augment UI.
