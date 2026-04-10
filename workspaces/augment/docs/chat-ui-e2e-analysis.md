# Chat UI End-to-End Analysis: Confirmed Issues

**Date:** April 2026
**Scope:** Complete chat UI flow — from `ChatInput` keystroke through SSE streaming to backend provider orchestration
**Method:** Line-by-line code read of every layer, issue confirmed with exact file/line references

---

## Architecture (quick reference)

```
ChatInput → useChatActions → useStreamingChat → AugmentApi (chatEndpoints)
    → fetch POST /chat/stream → parseSSEStream
    → updateStreamingState (reducer) → RAF batch → StreamingMessage UI
    → buildBotResponse → onMessagesChange

Backend:
chatRoutes POST /chat/stream → parseChatRequest → resolveConversationId
    → provider.chatStream() → SSE event forwarding → data: [DONE]

LlamaStack path: ResponsesApiProvider → ResponsesApiCoordinator
    → AdkOrchestrator (runStream) → BackstageModelAdapter → Llama Stack /v1/responses

Kagenti path: KagentiProvider → KagentiApiClient.chatStream
    → KagentiStreamNormalizer → NormalizedStreamEvent
```

---

## Confirmed Issues (prioritized by customer impact)

### P0 — Garbled output after network hiccup

|                  |                                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue**        | SSE retry duplicates partial events — no reducer state reset between attempts                                                                                                                                                                                                                                                                               |
| **Files**        | `plugins/augment/src/api/chatEndpoints.ts:58-106` (retry loop), `plugins/augment/src/hooks/useStreamingChat.ts:227-231` (event callback)                                                                                                                                                                                                                    |
| **Root cause**   | `streamSSE` retries up to 3 times. Each attempt calls `streamSSEAttempt` with the same `onEvent` callback. The callback updates `currentStreamingState` via `updateStreamingState`. On retry, the backend produces a fresh stream from scratch but the frontend's `currentStreamingState` still has text, tool calls, and handoffs from the failed attempt. |
| **Reproduction** | Simulate a network drop mid-stream (e.g., kill the connection after ~5 text.delta events). The retry sends the same request; the backend generates the full response again. The frontend accumulates both halves.                                                                                                                                           |
| **Impact**       | Duplicated/garbled text in the chat bubble. Tool calls may appear twice.                                                                                                                                                                                                                                                                                    |
| **Fix**          | Reset `currentStreamingState` to `createInitialStreamingState()` at the start of each retry in `streamSSE`. Emit a synthetic `stream.error` with `code: 'reconnecting'` first (already done), then reset state before the new attempt.                                                                                                                      |

### P1 — Conversation continuity silently breaks under load

|                  |                                                                                                                                                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue**        | `AdkOrchestrator.conversationStates` evicts entries at cap=500 with no warning                                                                                                                                                                                                                          |
| **Files**        | `plugins/augment-backend/src/providers/llamastack/adk-adapters/AdkOrchestrator.ts:79-80` (constant), `504-509` (eviction)                                                                                                                                                                               |
| **Root cause**   | In-memory `Map<string, RunState>` tracks which agent was active per conversation. When >500 entries exist, the oldest is silently deleted (line 507-508). Evicted conversations lose agent continuity — the next message restarts from `defaultAgent` instead of continuing with the active specialist. |
| **Reproduction** | Run 501+ concurrent conversations. The 1st conversation's `RunState` is evicted. User returns to it and finds the router agent instead of the specialist they were talking to. No error, no log.                                                                                                        |
| **Impact**       | User says "continue" and gets a different agent. Silent — no error shown.                                                                                                                                                                                                                               |
| **Fix**          | (a) Add a warn log when eviction happens. (b) Persist `RunState` to the database alongside the session, not just in-memory. (c) Consider LRU eviction instead of insertion-order eviction.                                                                                                              |

### P1 — Backend function tools visible to all agents

|                  |                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue**        | In backend tool execution mode, all discovered MCP tools are available to every agent regardless of per-agent `mcpServers` configuration                                                                                                                                                                                                                                                  |
| **Files**        | `plugins/augment-backend/src/providers/llamastack/adk-adapters/AdkOrchestrator.ts:301-305` (documented in comment), `307-336` (tool discovery), `269` (single `functionTools` array passed to all agents)                                                                                                                                                                                 |
| **Root cause**   | `discoverBackendTools` returns a flat `FunctionTool[]` that is passed to `RunOptions.functionTools`. The ADK's `buildAgentTools` filters `mcpServers` for MCP-type tools but does not filter `functionTools`. All agents in the graph see all function tools. The code's own comment says: "For backend-proxied function tools, proper per-agent filtering requires an ADK-level change." |
| **Reproduction** | Configure two agents: Agent A with `mcpServers: [server-a]`, Agent B with `mcpServers: [server-b]`. Enable backend tool execution. Agent A can call server-b's tools.                                                                                                                                                                                                                     |
| **Impact**       | Security/scope violation. A docs-only agent could access cluster mutation tools.                                                                                                                                                                                                                                                                                                          |
| **Fix**          | Requires ADK change in `buildAgentTools` to accept per-agent function tool filters, or partition `functionTools` by `mcpServers` config before passing to `RunOptions`.                                                                                                                                                                                                                   |

### P2 — Final content not scrolled into view

|                  |                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Issue**        | `flushStreamingState` does not invoke `onFlush` callback (scroll-to-bottom)                                                                                                                                                                                                                                                                                        |
| **Files**        | `plugins/augment/src/hooks/useStreamingStateBatching.ts:38-51` (`flushStreamingState`), `53-69` (`scheduleStreamingUpdate` — calls `onFlush`), `plugins/augment/src/hooks/useStreamingChat.ts:302,315` (flush calls)                                                                                                                                               |
| **Root cause**   | During streaming, `scheduleStreamingUpdate` queues an RAF that calls `onFlushRef.current?.()` (scroll-to-bottom). At stream end, `flushStreamingState()` cancels any pending RAF and applies state synchronously — but never calls `onFlush`. Any text that arrived between the last RAF and the synchronous flush renders below the viewport without auto-scroll. |
| **Reproduction** | Send a long message. At the very end, the last few lines may render below the fold. User must manually scroll down. Most visible with fast responses that complete before the RAF fires.                                                                                                                                                                           |
| **Impact**       | UX annoyance — user misses the end of the answer.                                                                                                                                                                                                                                                                                                                  |
| **Fix**          | Add `onFlushRef.current?.()` at the end of `flushStreamingState` (after `setState`).                                                                                                                                                                                                                                                                               |

### P2 — Form/auth errors are silent

|                  |                                                                                                                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue**        | `handleFormSubmit`, `handleAuthConfirm`, `handleSecretsSubmit` catch errors with `debugError` only — no user-visible feedback                                                                                               |
| **Files**        | `plugins/augment/src/components/ChatContainer/ChatContainer.tsx:386-387` (form), `436-437` (auth), `472-473` (secrets)                                                                                                      |
| **Root cause**   | Each handler's `catch` block calls `debugError(...)` (console.error in dev, noop in prod). The `finally` block clears `streamingState` and `isTyping`, so the form/auth card disappears. No error message is shown.         |
| **Reproduction** | Backend returns a 500 for `/chat/approve` while a form card is displayed. The form disappears. No feedback.                                                                                                                 |
| **Impact**       | User doesn't know the action failed. They think it succeeded because the form went away.                                                                                                                                    |
| **Fix**          | Add error state (like `useToolApproval`'s `approvalError`) and surface it as a snackbar or inline error in the form/auth card.                                                                                              |
| **Bonus**        | `handleFormCancel` (line 403-415) is fire-and-forget — it clears UI immediately without waiting for the backend response. If cancel fails server-side, the agent is still waiting for form input while the UI has moved on. |

### P2 — Kagenti session maps evict under high volume

|                  |                                                                                                                                                                                                                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue**        | `kagentiSessionMap` and `sessionAgentMap` bounded at 10k with ~10% eviction                                                                                                                                                                                                                                                              |
| **Files**        | `plugins/augment-backend/src/providers/kagenti/KagentiProvider.ts:66` (constant), `76-94` (`boundedMapSet`), `89-91` (warn log)                                                                                                                                                                                                          |
| **Root cause**   | Same pattern as the ADK conversation state issue but with a higher cap. Evicted sessions lose the Backstage-session-to-Kagenti-context mapping. A user returning to an old session starts a fresh Kagenti context instead of resuming.                                                                                                   |
| **Reproduction** | Deployment with >10k active sessions. Oldest 1k are evicted. Users returning to those sessions start fresh conversations.                                                                                                                                                                                                                |
| **Impact**       | Context loss for old sessions. Less severe than #2 because: (a) higher cap, (b) Kagenti context IDs are persisted to DB and hydrated on access (line 647-656), so this mainly affects sessions accessed during the same pod lifecycle that haven't been hydrated.                                                                        |
| **Fix**          | The DB hydration at `hydrateSessionContext` mostly mitigates this. The main gap is that hydration is only triggered from `chatRoutes.ts` when a request comes in — the in-memory map eviction is logged but doesn't trigger re-hydration. Consider removing the in-memory cap entirely and relying on DB lookups, or using an LRU cache. |

### P3 — No runtime validation of SSE events

|                |                                                                                                                                                                                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue**      | `JSON.parse` result typed as `StreamingEvent` without validation                                                                                                                                                                                                                                                        |
| **Files**      | `plugins/augment/src/api/sseStreaming.ts:65`                                                                                                                                                                                                                                                                            |
| **Root cause** | After `JSON.parse(data)`, the result is assumed to match the `NormalizedStreamEvent` union. No `type` field check, no required field validation. Unknown types fall to `default: return state` (harmless). Known types with wrong shapes (e.g., `stream.tool.started` without `callId`) create malformed state entries. |
| **Impact**     | Hard-to-debug failures during version upgrades or protocol mismatches. Low probability in normal operation.                                                                                                                                                                                                             |
| **Fix**        | Add a minimal guard: check that `typeof event.type === 'string'` before passing to `onEvent`. Optionally validate known types have required fields.                                                                                                                                                                     |

### P3 — `ResponsesApiProvider` type casts bypass safety

|                |                                                                                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue**      | Multiple `as unknown as NormalizedStreamEvent` casts in stream normalization                                                                                                                                                |
| **Files**      | `plugins/augment-backend/src/providers/llamastack/ResponsesApiProvider.ts:400,417,425`                                                                                                                                      |
| **Root cause** | When bridging raw ADK events to `NormalizedStreamEvent`, the provider uses double casts that bypass TypeScript's structural checks. If the event shape diverges, TypeScript won't catch it.                                 |
| **Impact**     | Type-safety gap; bugs surface at runtime only. Contained to the LlamaStack path.                                                                                                                                            |
| **Fix**        | Replace `as unknown as NormalizedStreamEvent` with a proper normalization function that validates the shape, or create typed factory functions (e.g., `createStreamEvent('stream.agent.handoff', { fromAgent, toAgent })`). |

### P3 — Stale closure risk in `sendMessage`

|                 |                                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Issue**       | `messages` array captured at invocation used at completion                                                                                                                                                               |
| **Files**       | `plugins/augment/src/hooks/useStreamingChat.ts:340` (`onMessagesChange([...messages, newMessage, botResponse])`)                                                                                                         |
| **Root cause**  | `sendMessage(text, messages)` receives `messages` as a parameter. Between invocation and completion (the entire streaming duration), the parent's `messages` state could change. The completion uses the stale snapshot. |
| **Mitigations** | `isTyping` disables send (ChatInput line 283), `createController()` aborts prior streams (line 174), session guard (line 339). These make the bug very unlikely in normal use.                                           |
| **Impact**      | Latent. Would only trigger if mitigations are weakened in future refactoring.                                                                                                                                            |
| **Fix**         | Use a ref for messages (like `useToolApproval` uses `messagesRef`) or use functional state update.                                                                                                                       |

### P3 — MCP connection leak on provider hot-swap

|                |                                                                                                                                                                                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Issue**      | `ResponsesApiProvider` has no `shutdown()`, so `BackendToolExecutor` MCP clients are never closed when swapping providers                                                                                                                                                                                                   |
| **Files**      | `plugins/augment-backend/src/providers/llamastack/ResponsesApiProvider.ts` (no `shutdown` method), `plugins/augment-backend/src/providers/ProviderManager.ts:132` (`old.shutdown?.()`), `plugins/augment-backend/src/providers/responses-api/tools/BackendToolExecutor.ts` (`closeAllClients()` exists but is never called) |
| **Root cause** | `ProviderManager.performSwap` calls `old.shutdown?.()`. `KagentiProvider` implements `shutdown()` (clearing maps, destroying client). `ResponsesApiProvider` does not. `BackendToolExecutor.closeAllClients()` exists but nothing invokes it from the LlamaStack provider teardown path.                                    |
| **Impact**     | Leaked MCP WebSocket/HTTP connections after provider switch. Low frequency since hot-swap is rare (admin panel action).                                                                                                                                                                                                     |
| **Fix**        | Add `shutdown()` to `ResponsesApiProvider` that calls `this.orchestrator.shutdown()`, which should call `BackendToolExecutor.closeAllClients()`.                                                                                                                                                                            |

### P3 — Reducer phase guard is a manual allowlist

|                |                                                                                                                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Issue**      | HITL phase guard blocks events by allowlist — new event types are silently dropped                                                                                                                                                                                                         |
| **Files**      | `plugins/augment/src/components/StreamingMessage/StreamingMessage.reducer.ts:80-101`                                                                                                                                                                                                       |
| **Root cause** | During `pending_approval`, `form_input`, or `auth_required` phases, the reducer only processes explicitly listed event types (11 types). All other events hit `default: return state`. Notably, `stream.agent.handoff` is blocked — a handoff during an approval flow is silently dropped. |
| **Impact**     | Maintenance burden. Adding new event types without updating the allowlist causes silent data loss during HITL flows.                                                                                                                                                                       |
| **Fix**        | Consider inverting the logic — block specific disruptive types (text, reasoning, RAG) instead of allowing specific types. Or add `stream.agent.handoff` to the allowlist and add a comment noting the pattern for future contributors.                                                     |

### P3 — Kagenti fallback emits `stream.completed` without `usage`

|                |                                                                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Issue**      | When Kagenti falls back from streaming to non-streaming on `-32603`, the synthetic `stream.completed` has no `usage` field                                                                                                                 |
| **Files**      | `plugins/augment-backend/src/providers/kagenti/KagentiProvider.ts:441`                                                                                                                                                                     |
| **Root cause** | The fallback path at line 434 calls `this.chat(request)` which returns a `ChatResponse` with `content` and `responseId` but no `usage`. The synthetic `stream.completed` at line 441 is `{ type: 'stream.completed' }` with no usage data. |
| **Impact**     | Token usage not shown in the UI for agents that don't support streaming. Minor.                                                                                                                                                            |
| **Fix**        | Include `usage` from the non-streaming response if available, or document that token usage is not available for non-streaming Kagenti agents.                                                                                              |

---

## Additional Findings (not bugs, but architecture notes)

1. **Output safety is post-stream.** Backend safety check on accumulated text runs after the stream completes (`chatRoutes.ts:524-545`). The text has already been sent to the client. The safety violation event is a warning appended after the fact, not a prevention. This is by design but worth noting.

2. **`handleFormCancel` is fire-and-forget.** At `ChatContainer.tsx:403-415`, the cancel call `.catch(err => debugError(...))` runs async while the UI immediately clears. If the cancel fails, the agent is still waiting for form input.

3. **Duplicate completion signals.** Backend emits `stream.completed` event AND `data: [DONE]\n\n`. Frontend ignores `[DONE]` in `parseSSEStream` (correct). Not a bug today, but the dual-signal pattern is fragile.

4. **Re-export drift.** Frontend `types.ts` re-exports 14 of 19 individual event interfaces from common. Missing: `StreamBackendToolExecutingEvent`, `StreamAgentHandoffEvent`, `StreamFormRequestEvent`, `StreamAuthRequiredEvent`, `StreamArtifactEvent`, `StreamCitationEvent`. The union `NormalizedStreamEvent` is available so there's no functional impact, but it's inconsistent.

---

## Fix Priority Summary

| Priority | Issue                               | Effort                           | Risk   |
| -------- | ----------------------------------- | -------------------------------- | ------ |
| P0       | SSE retry duplication               | Low (reset state in retry loop)  | Low    |
| P1       | Conversation state eviction         | Medium (DB persistence)          | Medium |
| P1       | Backend tools visible to all agents | High (ADK change needed)         | Medium |
| P2       | Missed scroll-to-bottom             | Low (one line)                   | None   |
| P2       | Silent form/auth errors             | Low (add error state)            | Low    |
| P2       | Kagenti session map eviction        | Low (DB hydration mostly covers) | Low    |
| P3       | No runtime SSE validation           | Low (type guard)                 | None   |
| P3       | Type casts in ResponsesApiProvider  | Medium (refactor normalization)  | Low    |
| P3       | Stale closure in sendMessage        | Low (use ref)                    | None   |
| P3       | MCP connection leak                 | Low (add shutdown method)        | None   |
| P3       | Reducer allowlist maintenance       | Low (invert logic)               | None   |
| P3       | Kagenti fallback missing usage      | Low (pass usage field)           | None   |
