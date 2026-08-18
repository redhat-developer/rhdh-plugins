## ADDED Requirements

### Requirement: Agent type discriminator

AiResource entities that represent agents MUST declare `spec.type` with the exact value `agent` (singular). The schema MUST NOT treat `agents` as a valid agent type discriminator.

#### Scenario: Singular agent type accepted

- **WHEN** an AiResource entity declares `spec.type: agent` with otherwise valid agent fields
- **THEN** the agent schema accepts the entity

#### Scenario: Plural agents type rejected for agent schema

- **WHEN** an entity is validated as an agent-shaped AiResource and declares `spec.type: agents`
- **THEN** the agent schema rejects it as an invalid agent type value

---

### Requirement: Agent instructions field

An agent-shaped AiResource (`spec.type: agent`) MAY omit `spec.instructions` when the agent image/runtime already provides a default prompt. When present, `spec.instructions` MUST be a string. Entity identity uses `metadata.name` (there is no separate `spec.name`). Standard catalog fields such as `spec.owner` and `spec.lifecycle` remain normal AiResource/entity expectations and are not redefined by this agent schema capability.

These are schema-layer requirements for agent authoring and tests; catalog processor behavior for agent-specific fields is specified under `ai-resource-agent-ingestion`.

#### Scenario: Minimal valid agent accepted

- **WHEN** an AiResource entity declares `spec.type: agent` and a valid `metadata.name` (with or without `spec.instructions`)
- **THEN** the agent schema accepts the entity

#### Scenario: Missing instructions accepted

- **WHEN** an AiResource entity declares `spec.type: agent` but omits `spec.instructions`
- **THEN** the agent schema accepts the entity

#### Scenario: Wrong-type instructions rejected

- **WHEN** an AiResource entity declares `spec.type: agent` but sets `spec.instructions` to a non-string value (for example a number or array)
- **THEN** the agent schema rejects the entity with an error that names `spec.instructions`

---

### Requirement: Optional fields per design mapping

The agent schema MUST allow the optional agent fields defined in this change’s `design.md` mapping table (under `spec` / `metadata`, not agent-specific annotations). Optional field membership and shapes SHALL follow that mapping rather than a divergent inventory in code.

At minimum, the mapping’s optional catalog fields include: `spec.instructions`, `spec.handoffDescription`, `spec.model`, `spec.handoffs` (`string[]`), `spec.tools` (`string[]`), `spec.toolUseBehavior`, `spec.resetToolChoice`, `spec.modelSettings` (`temperature`, `maxTokens`, `toolChoice` only for v1), and `spec.outputSchema`.

#### Scenario: Optional fields from mapping accepted

- **WHEN** a valid agent entity includes optional fields from the design mapping with correctly typed values
- **THEN** the agent schema accepts the entity

#### Scenario: Omitted optional fields accepted

- **WHEN** a minimal valid agent entity omits all optional agent-specific fields
- **THEN** the agent schema accepts the entity

#### Scenario: Invalid optional field type rejected

- **WHEN** an agent entity sets `spec.handoffs` to a non-array value or `spec.resetToolChoice` to a non-boolean value
- **THEN** the agent schema rejects the entity with an error naming the invalid field

#### Scenario: Opaque handoffs and tools strings accepted

- **WHEN** an agent entity sets `spec.handoffs` and `spec.tools` to arrays of arbitrary non-empty strings
- **THEN** the agent schema accepts them without requiring catalog entity-ref format

---

### Requirement: Agent fields in spec and metadata only

Agent configuration fields from the design mapping MUST be represented on the entity as `metadata.*` / `spec.*` fields. The agent schema MUST NOT introduce agent-specific annotations for those configuration fields.

#### Scenario: Spec-placed instructions accepted

- **WHEN** an agent entity provides `spec.instructions` (and omits agent-config annotations for the same data)
- **THEN** the agent schema accepts the entity

---

### Requirement: No OpenAI Agents SDK package dependency

The rhdh-plugins agent schema implementation MUST NOT import `@openai/agents-core` or other OpenAI Agents SDK packages.

#### Scenario: Schema module has no agents-core import

- **WHEN** the agent schema TypeScript sources and their direct dependencies are inspected
- **THEN** they do not import `@openai/agents-core` or `@openai/agents`

---

### Requirement: Examples and fixtures for agent entities

The workspace MUST provide example catalog YAML and/or test fixtures that demonstrate a representative agent entity covering required core fields and a non-empty subset of optional fields from the design mapping (including at least one of `handoffs` or `modelSettings`).

#### Scenario: Example catalog YAML exists

- **WHEN** a developer opens the workspace examples (or equivalent fixtures) for agent AiResources
- **THEN** at least one `kind: AiResource` document with `spec.type: agent` is present

#### Scenario: Fixture usable by schema tests

- **WHEN** schema/unit tests run
- **THEN** they load a representative agent fixture (or inline equivalent) that exercises core and optional fields

---

### Requirement: Schema-layer validation tests

Unit or schema tests MUST cover acceptance of valid agent entities and rejection of clearly invalid shapes at the schema layer (wrong `spec.type` for agent validation, wrong types on optional fields).

#### Scenario: Valid agent test passes

- **WHEN** the agent schema test suite runs against a minimal valid agent entity
- **THEN** the suite reports acceptance (no schema validation errors)

#### Scenario: Invalid agent test fails closed

- **WHEN** the agent schema test suite runs against an agent entity with a wrong-type optional field (for example `spec.handoffs` as a non-array)
- **THEN** the suite asserts a schema validation failure

---

### Requirement: Dual-track documentation for agent type

In-repo OpenSpec/design materials for this change MUST describe AiResource agent typing as owned under RHDHPLAN-1507 in rhdh-plugins, with upstream contribution tracked in parallel and not a merge gate. Materials MUST NOT leave agent typing described as blocked solely on RHDHPLAN-1113. The field mapping table in `design.md` MUST remain the shared field-set source for RHIDP-15866, RHIDP-15867, and RHIDP-15868.

#### Scenario: Design states dual-track ownership and field mapping

- **WHEN** a reader opens this change’s design/proposal artifacts
- **THEN** they find explicit dual-track (rhdh-plugins + upstream) language, RHDHPLAN-1507 ownership for the agent type, and the AiResource agent field mapping table
