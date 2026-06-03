# Provider Hot-Swap

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Switch AI platform providers at runtime without downtime or data loss. The system starts the new provider, validates it, swaps the active pointer, and shuts down the old — with automatic rollback on failure.

## EXISTING Requirements

### Requirement: Backend Hot-Swap Lifecycle

`ProviderManager.switchProvider()` implements a safe swap sequence.

#### Scenario: Successful provider switch

- **WHEN** the administrator selects a different provider in the admin panel
- **THEN** `ProviderManager` starts the new provider and fully initializes it
- **AND** on successful initialization, it atomically swaps the active provider pointer
- **AND** it shuts down the old provider after the swap completes

#### Scenario: Failed provider switch with rollback

- **WHEN** the new provider fails to initialize during a switch attempt
- **THEN** the system rolls back to the previous provider automatically
- **AND** an error notification is shown to the administrator
- **AND** the previous provider continues serving requests without interruption

### Requirement: Frontend Provider Change Adaptation

The frontend detects provider changes and performs a full state reset.

#### Scenario: Chat state reset on provider change

- **WHEN** the frontend detects a `providerId` change
- **THEN** it cancels any active stream
- **AND** resets the conversation and clears messages
- **AND** resets agent selection and clears input
- **AND** triggers `onNewChat()`

#### Scenario: UI adapts per provider capabilities

- **WHEN** the active provider changes
- **THEN** the welcome screen adapts (gallery strip for Kagenti, prompt groups for Llama Stack)
- **AND** agent selection behavior adapts (mandatory for Kagenti, free-form for Llama Stack)
- **AND** the admin sidebar adapts (KagentiSidebar with 8 panels vs CommandCenterHeader with 3 panels)
- **AND** conversation history re-scopes to the new `providerId`

## MODIFIED Requirements

### Requirement: Capability-Driven Rendering Replaces Provider ID Checks

Frontend layout decisions must use the `ProviderCapabilities` interface, not provider identity strings.

#### Scenario: Layout adapts via capabilities not provider ID

- **WHEN** the frontend determines which UI elements to show
- **THEN** it queries the active provider's `ProviderCapabilities` object
- **AND** it does NOT check `providerId === 'kagenti'` or any other provider identity string
- **AND** the pattern already used in `ModelToolsPanel` (filtering tabs by capability) is extended to `AdminLayout`, `ChatView`, and `ChatHeader`
