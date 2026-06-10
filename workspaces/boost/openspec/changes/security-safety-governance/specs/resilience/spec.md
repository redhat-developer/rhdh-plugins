# Resilience Patterns

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Graceful degradation when things go wrong — provider offline detection, error boundaries, and transient notifications.

## EXISTING Requirements

### Requirement: Provider Offline Detection

The system detects when the AI provider is unreachable and communicates this clearly.

#### Scenario: Provider goes offline

- **WHEN** `useStatus` detects the AI provider is down
- **THEN** `ProviderOfflineBanner` is displayed
- **AND** chat resumes automatically when the provider recovers

### Requirement: Error Boundaries

Per-message and page-level error isolation prevents cascading failures.

#### Scenario: Agent error contained

- **WHEN** an agent or streaming error occurs
- **THEN** `ErrorCard` is displayed inline on the affected message
- **AND** `BoostErrorBoundary` prevents the entire page from crashing
- **AND** other messages and navigation remain functional

### Requirement: Transient Notifications

Non-blocking feedback for operational events.

#### Scenario: Toast notifications

- **WHEN** a transient event occurs (config saved, connection tested, etc.)
- **THEN** a snackbar toast is shown via `useToast`
- **AND** it auto-dismisses after a timeout
