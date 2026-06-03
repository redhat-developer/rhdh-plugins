# Safety Shields and Guardrails

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Content safety filtering on agent inputs and outputs to prevent harmful, injected, or destructive content.

## EXISTING Requirements

### Requirement: Input Shields

Safety filters applied to user messages before sending to the model.

#### Scenario: Input shield detects prompt injection

- **WHEN** a user message is submitted to the agent
- **THEN** enabled input shields (prompt injection detection, harmful content filtering) are applied
- **AND** if a violation is detected and the shield is configured as fail-closed, the message is blocked and the user sees a safety message
- **AND** if configured as fail-open, the content passes through but the violation is logged

### Requirement: Output Shields

Safety filters applied to agent responses before displaying.

#### Scenario: Output shield detects harmful content

- **WHEN** an agent generates a response
- **THEN** enabled output shields (harmful content filtering, destructive command detection) are applied
- **AND** violation handling follows the same fail-open/fail-closed behavior as input shields

### Requirement: Shield Administration

Administrators configure shields and review violations.

#### Scenario: Admin configures shield behavior

- **WHEN** the admin opens the `SafetyEvalPanel`
- **THEN** `SafetyShieldsSection` shows available shields with enable/disable toggles
- **AND** each shield can be configured as fail-open or fail-closed
- **AND** `SafetyPatternsSection` allows custom safety patterns

#### Scenario: Violation logging

- **WHEN** any shield detects a violation
- **THEN** the violation details are logged for review regardless of fail-open/fail-closed setting
