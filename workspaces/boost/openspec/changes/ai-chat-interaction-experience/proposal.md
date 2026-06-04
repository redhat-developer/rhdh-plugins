# Proposal: AI Chat & Interaction Experience

## Why

Augment's core value is the developer-agent conversation interface. Without a compelling chat experience, the platform has no user-facing value regardless of backend configuration. The chat surface must deliver streaming responses, knowledge-grounded answers with citations, human-in-the-loop approval for sensitive actions, persistent conversation history, and developer debugging tools.

The current implementation delivers all product capabilities but the frontend is monolithic — all 204 admin panel files and all provider-specific components are eagerly loaded for every user. The chat view needs composable extensions, lazy loading, and capability-driven rendering.

## What Changes

### Current Capabilities (retroactive documentation)

- Streaming chat with real-time phase indicators and rich markdown rendering
- Knowledge-grounded answers (RAG) with source citations and expandable source cards
- Human-in-the-loop approval for tool calls with parameter editing
- Interactive cards (forms, auth flows) within conversations
- Conversation history with search, resume, feedback, and export
- Developer tools: execution trace, session inspector, message inspector
- Provider-adaptive chat experience (Llama Stack vs Kagenti paths)

### Architectural Improvements (from tech debt analysis)

- Lazy loading in `ChatView.tsx` for provider-specific components (204 admin panel files currently eagerly loaded)
- Split `AugmentPage` into composable routable extensions (chat, admin, agent studio)
- Capability-driven rendering replacing provider ID string checks
- Frontend feature flags via `app-config.yaml` and Backstage `featureFlagsApiRef`

## Impact

- `plugins/augment/src/plugin.ts` — new composable extensions
- `plugins/augment/src/components/ChatView.tsx` — lazy loading
- `plugins/augment/src/components/AugmentPage/AdminLayout.tsx` — lazy loading, capability checks
- `plugins/augment/src/config.d.ts` — feature flags schema
