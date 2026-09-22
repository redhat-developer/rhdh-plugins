# Normalized Streaming Protocol

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

One event contract between all backend providers and the frontend. Each provider maps its native events to `NormalizedStreamEvent` so the frontend works identically regardless of active backend.

## EXISTING Requirements

### Requirement: NormalizedStreamEvent Union Type

A single union type in the common package covers all streaming event categories.

#### Scenario: Event categories cover full agent interaction lifecycle

- **WHEN** a provider emits streaming events during a chat interaction
- **THEN** each native event is mapped to one of the `NormalizedStreamEvent` discriminated union members
- **AND** the union covers: text deltas, reasoning, tool calls, RAG results, handoffs, approvals, forms, auth, artifacts, citations, completion, and errors

#### Scenario: Llama Stack stream normalization

- **WHEN** the `ResponsesApiProvider` receives SSE events from Llama Stack
- **THEN** `normalizeLlamaStackEvent()` maps each event to the corresponding `NormalizedStreamEvent`
- **AND** multi-agent handoff events produce `stream.handoff` normalized events with source and target agent identifiers

#### Scenario: Kagenti stream normalization

- **WHEN** the `KagentiProvider` receives A2A `TaskStatusUpdateEvent` or `TaskArtifactUpdateEvent`
- **THEN** `KagentiStreamNormalizer` maps them to `NormalizedStreamEvent`
- **AND** A2A task state transitions map to appropriate stream lifecycle events (start, progress, completion)

### Requirement: Frontend Stream Processing

The frontend processes normalized events identically regardless of provider.

#### Scenario: StreamingMessage reducer handles all event types

- **WHEN** an SSE event arrives at the frontend via `sseStreaming.ts`
- **THEN** `StreamingMessage.reducer` processes it based on the `NormalizedStreamEvent` discriminator
- **AND** `useStreamingStateBatching` batches rapid events for performant rendering
- **AND** `VirtualizedMessageList` renders the accumulated state

## ADDED Requirements

### Requirement: Specification Coverage

This capability area MUST have its existing behavior documented as baseline acceptance criteria.

#### Scenario: Baseline validation

- **WHEN** the existing implementation is validated against this specification
- **THEN** all scenarios described in the EXISTING Requirements section MUST pass
