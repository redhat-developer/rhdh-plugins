# Human-in-the-Loop Approval

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Review proposed agent actions (tool calls) before execution, with the ability to edit parameters, approve, or reject. No destructive action executes without explicit developer consent.

## EXISTING Requirements

### Requirement: Tool Call Approval Dialog

Agents pause before executing sensitive tool calls and request user approval.

#### Scenario: Tool call requiring approval

- **WHEN** an agent proposes a tool call where `requireApproval: true` is configured
- **THEN** a `ToolApprovalDialog` displays: tool name, target system, and exact arguments
- **AND** the inference loop is paused on the backend via `BackendApprovalStore`
- **AND** the user can review, edit parameters via JSON editor, then approve or reject

#### Scenario: User approves tool call

- **WHEN** the user clicks approve in the approval dialog
- **THEN** `BackendApprovalHandler` resumes the paused inference loop
- **AND** the tool executes with the approved (potentially edited) parameters
- **AND** the result flows back into the conversation

#### Scenario: User rejects tool call

- **WHEN** the user clicks reject in the approval dialog
- **THEN** the agent is notified of the rejection
- **AND** it adjusts its approach without executing the tool

#### Scenario: Auto-approve for read-only tools

- **WHEN** a tool call is configured with `requireApproval: false`
- **THEN** it executes automatically without showing the approval dialog

### Requirement: Interactive Cards

Agents can request structured input or authentication within conversations.

#### Scenario: Form card for structured input

- **WHEN** an agent requires structured input from the user
- **THEN** it emits a form card with typed fields rendered inline in the conversation
- **AND** the user fills and submits the form, resuming the agent flow

#### Scenario: Auth card for external authentication

- **WHEN** an agent requires external authentication
- **THEN** it emits an auth card with an OAuth sign-in flow
- **AND** on successful authentication, the agent continues with the obtained credentials

### Requirement: Approval Audit Trail

Every approval decision is persisted for auditability.

#### Scenario: Approval decisions stored in session

- **WHEN** a user approves or rejects a tool call
- **THEN** the decision (approve/reject), timestamp, parameters, and user identity are stored in the session history
- **AND** they are visible in the execution trace panel (dev mode)
