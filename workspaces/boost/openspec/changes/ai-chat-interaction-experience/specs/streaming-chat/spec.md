# Streaming Chat

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Real-time streamed conversation with specialist AI agents, including phase indicators, rich rendering, and provider-adaptive behavior.

## EXISTING Requirements

### Requirement: Real-Time Streaming with Phase Indicators

The chat interface streams responses incrementally with visible progress phases.

#### Scenario: User sends a message and receives streamed response

- **WHEN** a user submits a message via the chat input
- **THEN** the system sends it to the active AI provider and begins streaming
- **AND** real-time phase indicators show progress: thinking, reasoning, searching, calling tools, generating
- **AND** the response renders incrementally: markdown, code blocks with syntax highlighting, reasoning summary, source citations, and token usage

#### Scenario: Llama Stack path with router agent handoff

- **WHEN** a message is sent on the Llama Stack provider path
- **THEN** it routes to the configured default agent
- **AND** a router agent may hand off to a specialist mid-conversation
- **AND** the user sees a handoff divider: "Handed off from [Agent A] to [Agent B]"

#### Scenario: Kagenti path with mandatory agent selection

- **WHEN** a message is sent on the Kagenti provider path
- **THEN** the user must have selected an agent from the gallery before sending
- **AND** the chat header shows agent name, streaming/A2A mode, namespace, and health status

### Requirement: Resilience During Chat

The chat interface degrades gracefully on errors.

#### Scenario: Provider goes offline during chat

- **WHEN** `useStatus` detects the AI provider is unreachable
- **THEN** a `ProviderOfflineBanner` is displayed
- **AND** chat resumes automatically when the provider recovers

#### Scenario: Agent error during streaming

- **WHEN** an agent returns an error during a streaming response
- **THEN** an `ErrorCard` is displayed inline within the message
- **AND** the page does not crash (protected by `AugmentErrorBoundary`)
- **AND** the conversation remains navigable

### Requirement: Conversation Auto-Save

Conversations are persisted automatically.

#### Scenario: Successful response triggers auto-save

- **WHEN** a streaming response completes successfully
- **THEN** the conversation (session and messages) is auto-saved via `ChatSessionService`
- **AND** the session appears in the conversation history panel
