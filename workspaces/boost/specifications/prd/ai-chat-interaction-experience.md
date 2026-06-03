# PRD: AI Chat & Interaction Experience

**Product:** Boost — Agentic Developer Portal for Red Hat Developer Hub
**Status:** Requirements for new implementation (informed by Augment reference prototype)
**Date:** 2026-05-19
**Updated:** 2026-06-02 — reframed for boost; composable extensions with lazy loading from day one, UX/UXD-driven development
**Priority:** P0
**Provenance:** Requirements derived from Augment plugin analysis. See `specifications/boost-context.md` for project context.

---

## Why

Augment's core value proposition is enabling developers to have intelligent, grounded conversations with specialist AI agents — directly within their developer portal. Without a compelling chat experience, the platform has no user-facing value regardless of what's configured behind it.

This PRD defines the primary interaction surface: the streaming chat interface, knowledge-grounded answers, human-in-the-loop approval controls, conversation history management, and developer debugging tools. Together, these capabilities form the "inner loop" of the developer-agent relationship.

## What This Product Does

A developer opens Boost in Red Hat Developer Hub, asks a question in natural language, and receives a real-time streamed answer from a specialist AI agent. The answer may be grounded in the organization's own documentation (RAG), may involve tool calls that require human approval (HITL), and is persisted so the developer can return to it later. Professional developers can inspect the full execution trace for transparency and debugging.

## Who It's For

### Citizen Developer

Business domain expert or non-traditional developer who uses AI agents through the chat interface. Asks questions, receives answers, approves or rejects sensitive actions, and reviews past conversations.

### Professional Developer

Engineer who additionally uses debug/inspection tools to understand agent behavior, verify reasoning chains, and troubleshoot issues.

## Boundaries

### In Scope

- Streaming chat with real-time phase indicators and rich message rendering
- Knowledge-grounded answers (RAG) with source citations
- Human-in-the-loop approval for sensitive agent actions (tool calls)
- Interactive cards (forms, auth flows) within conversations
- Conversation history with search, resume, feedback, and export
- Developer tools: execution trace, session inspector, message inspector
- Provider-adaptive chat experience (Llama Stack vs Kagenti paths)

### Out of Scope

- Agent creation and lifecycle management (see Agent Creation & Discovery PRD)
- AI provider selection and hot-swap (see Platform Architecture PRD)
- Platform deployment and runtime configuration (see Platform Operations PRD)
- Safety shields and security posture (see Security & Governance PRD)

### UX/UXD Integration

All frontend components and UI flows must align with RHDH usability and visual design standards. This requires interlocking with the UX/UXD team throughout development:

- **Mockups as source of truth:** UI implementation follows mockups, wireframes, and design specs provided by UX/UXD (Figma, Sketch, or equivalent). No frontend feature ships without a corresponding approved design artifact.
- **PatternFly alignment:** All components use PatternFly design system components and patterns consistent with the broader RHDH experience. Custom components require UX/UXD review.
- **Design review gates:** Frontend PRs that introduce or modify user-visible UI require UX/UXD sign-off before merge. This applies to chat message rendering, approval dialogs, conversation history, agent gallery, admin panels, and all interactive cards.
- **Accessibility:** All UI meets WCAG 2.1 AA standards consistent with RHDH accessibility requirements. Keyboard navigation, screen reader support, and color contrast are validated against UX/UXD accessibility guidelines.

---

## Capabilities

### 1. Streaming Chat (UC-1)

**Goal:** Ask a question in natural language and receive a streamed, grounded answer from a specialist AI agent with reasoning visible in real time.

**How it works:**

- User types a question in the chat input
- The system sends the message to the active AI provider; streaming begins
- Real-time phase indicators show progress: thinking, reasoning, searching, calling tools, generating
- The response renders incrementally: markdown, code blocks with syntax highlighting, reasoning summary, source citations (if RAG), token usage
- Conversation is auto-saved on completion

**Provider-specific behavior:**

- **Llama Stack path:** Messages route to the configured default agent. A router agent may hand off to a specialist mid-conversation. The user sees a handoff divider: "Handed off from [Agent A] to [Agent B]."
- **Kagenti path:** User must select an agent from the gallery before sending the first message. The chat header shows agent name, streaming/A2A mode, namespace, and health status.

**Resilience:** Provider-offline banner when the AI platform is unreachable. Error cards displayed inline on agent errors (no page crash via error boundary).

**Success outcome:** Developer receives a grounded answer with visible reasoning. Conversation is persisted and resumable.

**Epics/Stories:** Epic 4 (Features 4.1, 4.2, 4.5, 4.6), Epic 1 (Feature 1.5)

### 2. Knowledge-Grounded Answers / RAG (UC-2)

**Goal:** Ask about internal documentation, runbooks, or policies and receive an answer grounded in the organization's knowledge base, with source citations.

**How it works:**

- User asks a question about internal documentation
- The agent determines retrieval is relevant and searches the knowledge base; UI shows "Searching knowledge base..." in real time
- The response includes a RAG sources section: document name, chunk text, relevance score
- User can expand sources to verify the answer against original documentation

**Edge cases:**

- No relevant results: agent indicates it could not find relevant information and answers from general knowledge, noting the limitation
- Multiple knowledge bases: searches across all configured vector stores, showing which store each source came from

**Success outcome:** Answers cite specific internal documents. Developers can trace every claim to a source.

**Epics/Stories:** Epic 6 (Feature 6.1), Epic 4 (Story 4.2.4)

### 3. Human-in-the-Loop Approval (UC-3)

**Goal:** Review a proposed agent action (tool call) before it executes, with the ability to edit parameters, approve, or reject.

**How it works:**

- Agent proposes a tool call requiring approval (per configured policy)
- Approval dialog shows tool name, target system, and exact arguments
- User reviews, optionally edits parameters via JSON editor, then approves or rejects
- On approval: backend resumes the paused inference loop, tool executes, result flows back into the conversation
- On rejection: agent adjusts its approach

**Additional interactive patterns:**

- **Form cards:** Agent requests structured input via typed form fields
- **Auth cards:** Agent requires external authentication via OAuth sign-in flow
- **Auto-approve:** Read-only tools configured with `requireApproval: false` execute automatically

**Audit:** Every approval decision is stored in session history.

**Success outcome:** No destructive action executes without explicit developer consent. Approval trail is auditable.

**Epics/Stories:** Epic 5 (Features 5.1, 5.2)

> **Note:** UC-4 (Agent Gallery & Discovery) is defined in the [Agent Creation & Discovery PRD](agent-creation-discovery.md).

### 4. Conversation History (UC-5)

**Goal:** Return to past conversations, search history, provide feedback, and export sessions.

**How it works:**

- Right pane shows grouped sessions with search, scoped to the active provider
- User selects a past session (confirmation dialog if a stream is active)
- Full conversation loads with all messages, tool calls, and metadata
- User can continue the conversation or review past exchanges

**Interactions:**

- Search by keyword
- Delete sessions
- Thumbs up/down feedback with optional reasons on individual messages
- Edit and regenerate past questions
- Copy message content
- Export full conversation
- Admin: toggle "Show all users" to view cross-user sessions

**Success outcome:** Conversations are persistent, searchable, and actionable.

**Epics/Stories:** Epic 4 (Features 4.3, 4.4, 4.7)

### 5. Debug & Inspect Agent Execution (UC-6)

**Goal:** Understand what an agent did, which tools it called, and why — using developer tools for transparency and troubleshooting.

**How it works:**

- User enables dev mode via chat header toggle
- **Execution trace panel:** Step-by-step trace — each agent turn, tool call, and reasoning step as a span
- **Message inspector:** Raw payload for a specific message
- **Session state inspector:** Full session JSON (session ID, message count, provider, agent, metadata)

**Additional features:**

- Tool call drill-down: expand to see full input arguments and output
- Reasoning inspection: expand to see full chain-of-thought
- Phase chips: visible in dev mode showing timing of each phase
- Keyboard shortcuts for power user navigation

**Success outcome:** User understands the agent's reasoning path, tool calls, and data flow.

**Epics/Stories:** Epic 4 (Feature 4.7)

---

## Architecture Context

The chat experience spans the full plugin stack:

**Frontend (`plugins/augment/src/`):**

- `ChatContainer` orchestrates the chat experience (welcome vs thread mode)
- `StreamingMessage` with `StreamingProgress` for real-time rendering
- `ChatInput` for composition with agent selection
- `ToolApprovalDialog` for HITL flows
- `VirtualizedMessageList` for performant message display
- `RightPane` with `ConversationHistory` and `AgentInfoSection`
- `ExecutionTracePanel`, `SessionStateInspector`, `MessageInspectorPanel` for dev tools

**Frontend composability (boost design principles):**
Boost builds composable from the start, avoiding augment's monolithic frontend patterns:

- Composable routable extensions (`BoostChatPage`, `BoostAdminPage`, `BoostAgentStudioPage`) with `React.lazy()` at extension boundaries
- Config-driven feature flags (`boost.features.*`) to toggle features per deployment
- All UI surfaces (CommandCenter, Skills, Marketplace, ToolRegistry) lazy-loaded by default
- No component exceeds reasonable size without decomposition
- All UI built from UX/UXD-provided mockups with PatternFly alignment

**Backend (`plugins/augment-backend/src/`):**

- `chatRoutes.ts`: POST `/chat/stream`, POST `/chat/approve`
- `sessionRoutes.ts`: GET `/sessions`, GET `/sessions/:id/messages`
- `ChatSessionService`: session persistence (SQLite dev, PostgreSQL prod)
- `BackendApprovalStore` / `BackendApprovalHandler`: HITL continuation
- Streaming pipeline: `createStreamEventForwarder` → provider → `NormalizedStreamEvent` → SSE

**Common (`plugins/augment-common/`):**

- `NormalizedStreamEvent` union type covering all stream event categories
- Permission contracts: `augmentAccessPermission`, `augmentAdminPermission`

---

## Traceability

| Capability           | Use Case | Priority | Stories                                                         |
| -------------------- | -------- | -------- | --------------------------------------------------------------- |
| Streaming Chat       | UC-1     | P0       | 4.1.1-4.1.4, 4.2.1-4.2.6, 1.5.1-1.5.7, 2.1.2-2.1.3, 8.5.1-8.5.2 |
| Knowledge Q&A (RAG)  | UC-2     | P0       | 6.1.1-6.1.3, 4.2.4                                              |
| HITL Approval        | UC-3     | P0       | 5.1.1-5.1.3, 5.2.1-5.2.3                                        |
| Conversation History | UC-5     | P0       | 4.3.1-4.3.3, 4.4.1-4.4.3, 4.7.4, 1.5.5                          |
| Debug & Inspect      | UC-6     | P2       | 4.7.1-4.7.5, 4.2.3, 4.2.5                                       |

---

## Customer Context

Derived from the Citi engagement ("Cloud Concierge" vision). Citi's success outcomes addressed by this PRD:

- Developers get answers from internal knowledge without leaving the portal (UC-1, UC-2)
- Sensitive operations stay under human control (UC-3)
- Agents act on live systems/applications with human oversight (UC-3)
