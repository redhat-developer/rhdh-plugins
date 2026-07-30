# Conversation History

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Persistent, searchable conversation history with feedback, export, and developer inspection tools.

## EXISTING Requirements

### Requirement: Session Management and Search

Past conversations are accessible, searchable, and resumable.

#### Scenario: Browse conversation history

- **WHEN** the user opens the right pane
- **THEN** grouped sessions are displayed with search
- **AND** sessions are scoped to the active provider's `providerId`

#### Scenario: Resume past conversation

- **WHEN** the user selects a past session
- **THEN** a confirmation dialog appears if a stream is currently active
- **AND** the full conversation loads with all messages, tool calls, and metadata
- **AND** the user can continue the conversation or review past exchanges

#### Scenario: Search by keyword

- **WHEN** the user types a search term in the history panel
- **THEN** sessions matching the keyword in message content are filtered and displayed

### Requirement: Session Interactions

Users can take actions on sessions and individual messages.

#### Scenario: Provide feedback on a message

- **WHEN** the user clicks thumbs up or thumbs down on an agent response
- **THEN** the feedback is stored via `boost_feedback` table with optional reasons
- **AND** the feedback is associated with the specific message ID

#### Scenario: Edit and regenerate

- **WHEN** the user edits a past question
- **THEN** the edited message is re-sent to the agent
- **AND** a new response is generated from the edited prompt

#### Scenario: Export conversation

- **WHEN** the user clicks export on a session
- **THEN** the full conversation is exported in a structured format

#### Scenario: Admin cross-user view

- **WHEN** an admin toggles "Show all users" in the history panel
- **THEN** sessions from all users are visible (not just the current user's)
- **AND** this is gated by `boost.admin` permission

### Requirement: Developer Inspection Tools

Professional developers can inspect agent execution for transparency and debugging.

#### Scenario: Enable dev mode

- **WHEN** the user toggles dev mode via the chat header
- **THEN** the execution trace panel shows step-by-step trace (agent turns, tool calls, reasoning steps as spans)
- **AND** the message inspector shows raw payload for individual messages
- **AND** the session state inspector shows full session JSON

#### Scenario: Tool call drill-down in dev mode

- **WHEN** the user expands a tool call in the execution trace
- **THEN** full input arguments and output are visible
- **AND** timing data (phase chips) shows duration of each phase

## ADDED Requirements

### Requirement: Specification Coverage

This capability area MUST have its existing behavior documented as baseline acceptance criteria.

#### Scenario: Baseline validation

- **WHEN** the existing implementation is validated against this specification
- **THEN** all scenarios described in the EXISTING Requirements section MUST pass
