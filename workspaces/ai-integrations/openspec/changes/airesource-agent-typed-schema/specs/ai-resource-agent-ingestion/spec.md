## ADDED Requirements

### Requirement: Processor validates agent-specific fields

When an AiResource entity declares `spec.type: agent`, the catalog processor MUST validate agent-specific fields from the design mapping. Validation MUST be limited to agent-specific fields and MUST NOT re-implement core entity validation for fields such as `spec.owner` or `spec.lifecycle`.

#### Scenario: Valid agent entity ingests

- **WHEN** an AiResource entity with `spec.type: agent` and non-empty `spec.instructions` (and correctly typed optional agent fields, if present) is ingested
- **THEN** the catalog processor accepts it

#### Scenario: Missing instructions rejected at ingestion

- **WHEN** an AiResource entity with `spec.type: agent` omits `spec.instructions` or sets it to an empty string
- **THEN** the catalog processor rejects ingestion with an actionable error that names `spec.instructions`

#### Scenario: Wrong-type instructions rejected at ingestion

- **WHEN** an AiResource entity with `spec.type: agent` sets `spec.instructions` to a non-string value (for example a number or array)
- **THEN** the catalog processor rejects ingestion with an actionable error that names `spec.instructions`

#### Scenario: Invalid optional agent field shape rejected at ingestion

- **WHEN** an AiResource entity with `spec.type: agent` sets an optional agent field to a clearly wrong type (for example `spec.handoffs` as a non-array, or `spec.resetToolChoice` as a non-boolean)
- **THEN** the catalog processor rejects ingestion with an actionable error naming the invalid field

---

### Requirement: Opaque handoffs and tools at processor layer

For `spec.type: agent`, the processor MUST accept `spec.handoffs` and `spec.tools` as arrays of strings without requiring catalog entity-ref format.

#### Scenario: Opaque string arrays accepted on ingest

- **WHEN** an otherwise valid agent entity sets `spec.handoffs` and/or `spec.tools` to arrays of arbitrary non-empty strings
- **THEN** the catalog processor accepts the entity without entity-ref format errors

---

### Requirement: Actionable processor errors

Agent validation errors MUST identify the field path, the problem (missing/empty/wrong type), and MUST NOT expose internal class names or stack traces to catalog authors.

#### Scenario: Error names the field

- **WHEN** processor validation fails for an agent entity
- **THEN** the error message includes the relevant `spec.*` field path

---

### Requirement: Non-agent AiResources unchanged

AiResource entities that are not `spec.type: agent` MUST continue to follow existing extension processor behavior (for example scope / OCI rules) without new agent-field requirements.

#### Scenario: Skill entity not subject to agent instructions rule

- **WHEN** an AiResource entity declares `spec.type: skill` and omits `spec.instructions`
- **THEN** the agent-specific instructions validation does not apply

---

### Requirement: Processor automated tests

Automated tests MUST cover processor accept and reject paths for agent entities, including missing `spec.instructions` and at least one invalid optional field shape.

#### Scenario: Accept path covered

- **WHEN** the processor test suite runs against a valid agent entity
- **THEN** ingestion validation succeeds

#### Scenario: Reject path covered

- **WHEN** the processor test suite runs against an agent entity missing `spec.instructions`
- **THEN** the suite asserts a validation failure
