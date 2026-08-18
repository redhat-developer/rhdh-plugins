# Google ADK Web Analysis — Architecture Deep Dive and Augment Opportunity Map

## Overview

This document captures the end-to-end architectural analysis of [Google ADK Web](https://github.com/google/adk-web) and its comparison against the Augment chat UI plugin for Backstage/RHDH. The analysis was performed from a product manager's perspective to identify specific patterns worth adopting and those to skip.

---

## Part 1: How Google ADK Web Works End-to-End

### Architecture

ADK Web is a **single-route Angular 21 app** where `ChatComponent` is the sole orchestration controller. There is no multi-page routing — the entire UI renders inside `<app-chat>`.

**Bootstrap chain**: `runtime-config.json` → `main.ts` (standalone bootstrap) → `AppComponent` → `ChatComponent`

### Services Layer

| Service             | Responsibility                                                             |
| ------------------- | -------------------------------------------------------------------------- |
| `AgentService`      | SSE streaming via `POST /run_sse` — parses `data:` events to `LlmResponse` |
| `SessionService`    | REST CRUD for `/apps/{app}/sessions`                                       |
| `StreamChatService` | WebSocket live audio/video streaming                                       |
| `TraceService`      | Span selection bridge between trace tree and event detail                  |
| `EventService`      | Debug trace fetching, Graphviz graph rendering                             |
| `EvalService`       | Evaluation sets and runs                                                   |
| `FeedbackService`   | Per-message thumbs up/down                                                 |
| `UiStateService`    | Loading state flags                                                        |

### UI Components

| Component              | Purpose                                                       |
| ---------------------- | ------------------------------------------------------------- |
| `ChatPanelComponent`   | Message rendering, streaming display, input area              |
| `SidePanelComponent`   | App selector (`mat-select`), session list, tab container      |
| `TraceTabComponent`    | Trace tree grouped by invocation                              |
| `TraceEventComponent`  | Bottom detail panel with JSON, LLM request/response, Graphviz |
| `StateTabComponent`    | Full session state JSON tree (`ngx-json-viewer`)              |
| `ArtifactTabComponent` | Inline artifacts display                                      |
| `EvalTabComponent`     | Evaluation UI                                                 |
| `CanvasComponent`      | Visual agent builder (`ngx-vflow`)                            |

### Key Design Decisions

1. **Agent = "app name"** — selected from a flat `GET /list-apps` dropdown with search. No catalog, cards, or rich metadata. This is a **developer tool**, not a product-facing marketplace.

2. **SSE streaming** — `AgentService.runSse` posts to `/run_sse`, reads chunks line-by-line. Very similar to Augment's `sseStreaming.ts`.

3. **Thought display** — inline italic gray text with a "Thought" chip. No separate reasoning panel.

4. **Tool calls** — stroked Material buttons with bolt icons and JSON tooltip on hover.

5. **No handoff visualization** — each bot message shows `event.author` as a colored icon tooltip, but no divider or transition UI.

6. **Dual trace surfaces** — side panel trace tree + resizable bottom panel for event detail.

7. **Full session state viewer** — `ngx-json-viewer` for the complete session state tree.

8. **Per-message feedback** — thumbs up/down with structured reasons and free-text comment.

9. **Drag-resizable panels** — CSS variable-driven `ResizableDrawerDirective`.

10. **Builder/Canvas** — `ngx-vflow` for visual agent composition.

---

## Part 2: Where Augment Is Already Superior

These areas represent clear Augment advantages that should **not** be regressed:

| Area                      | Augment                                                                  | ADK Web                              |
| ------------------------- | ------------------------------------------------------------------------ | ------------------------------------ |
| **Agent Catalog**         | Full-screen catalog with search, tabs, featured agents, preview, pinning | Simple `mat-select` dropdown         |
| **Welcome Experience**    | Branded hero, featured agent cards, conversation starters, prompt groups | Blank chat on load                   |
| **Handoff Visualization** | `HandoffDivider` with agent name, reason, breadcrumb path                | Just a color change on bot icon      |
| **Human-in-the-Loop**     | Tool approval, form cards, OAuth, secrets prompts                        | Basic `LongRunningResponseComponent` |
| **Execution Trace**       | Inline with messages, sticky during streaming, status counts             | Developer-facing raw JSON tree       |
| **Streaming UX**          | Phase chips, reasoning display, typing cursor, `ThinkingIndicator`       | Buffer progress bar                  |
| **Conversation History**  | Grouped by date, search, admin view, rename                              | Basic session list                   |
| **Branding/Theming**      | Configurable logo, colors, app name                                      | Fixed Google branding                |

---

## Part 3: Patterns Adopted from ADK Web

### ADOPT-1: Per-Message Feedback (Thumbs Up/Down) — **Implemented**

**Why**: Table-stakes for enterprise AI — enables RLHF data collection, quality monitoring, and user satisfaction measurement.

**What we built**:

- `MessageFeedback` component with thumbs up/down buttons
- Expandable panel with structured reasons (positive: Accurate, Helpful, Well-written, Creative; negative: Inaccurate, Not helpful, Incomplete, Too verbose, Off-topic)
- Optional free-text comment field
- Backend `POST /feedback` endpoint with `augment_message_feedback` database table
- Full-stack wiring: `MessageFeedback` → `MessageActionButtons` → `VirtualizedMessageList` → `ChatContainer` → `AugmentApi` → `sessionEndpoints` → backend route → `ChatSessionService.saveFeedback`

### ADOPT-2: Session State JSON Tree Viewer — **Implemented**

**Why**: Helps developers and advanced users understand what the agent "remembers" and debug unexpected behavior. ADK Web's `ngx-json-viewer` was a clear gap.

**What we built**:

- `JsonTreeViewer` — lightweight recursive React component for rendering JSON trees with expand/collapse, syntax-highlighted values, and depth limiting
- Integrated into `SessionStateInspector` as an expandable "Session State" section
- Backend `GET /sessions/:sessionId/state` endpoint returning session metadata, message counts by role, agent list, and last activity
- Refresh and copy-to-clipboard actions

### ADOPT-3: Drag-Resizable Side Panel — **Implemented**

**Why**: Quality-of-life improvement for power users who want wider conversation history or narrower panels for more chat space.

**What we built**:

- Drag handle on the left edge of `RightPane` (4px wide, highlighted on hover)
- Mouse event handlers for drag start/move/end with body cursor management
- Width constrained between 280px (min) and 600px (max), defaulting to 340px
- Transitions disabled during drag for smooth resizing, restored on release
- Mobile excluded (mobile uses fixed-width Drawer)

---

## Part 4: Patterns Intentionally Skipped

| Pattern                             | Reason                                                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Builder/Canvas**                  | Augment's agent creation is via Kagenti/configuration, not visual flow building. Different product paradigm with massive scope.                               |
| **WebSocket Live Audio/Video**      | Augment is text-first enterprise chat. Audio/video is a different product category.                                                                           |
| **Graphviz Event Graph SVG**        | Requires Graphviz renderer dependency. Execution trace panel already provides cleaner user-facing timeline.                                                   |
| **Infinite Scroll Message Loading** | ADK Web's implementation is incomplete (`UiStateService.lazyLoadMessages` throws "Not implemented"). Augment's `VirtualizedMessageList` already handles this. |

---

## Part 5: The Strategic Summary

**Augment's chat UI is a significantly more polished, product-grade experience than ADK Web.** ADK Web is a developer debugging tool — it excels at raw inspection (JSON trees, trace spans, event graphs) but lacks the consumer-facing polish that Augment has (branding, agent catalog, handoff visualization, HITL flows, streaming UX).

The three adopted patterns fill specific gaps:

1. **Per-message feedback** — the most impactful adoption, addressing a table-stakes enterprise AI requirement
2. **Session state viewer** — developer/power-user debugging capability
3. **Resizable panels** — polish and flexibility

Everything else in ADK Web is either already done better in Augment or not relevant to its product positioning as an enterprise agentic AI platform embedded in Backstage/RHDH.
