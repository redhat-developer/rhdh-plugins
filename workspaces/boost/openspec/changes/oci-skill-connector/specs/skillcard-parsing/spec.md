# Skillcard Parsing, Validation, and Entity Emission

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Parses `skillcard.yaml` from OCI image layers, validates against the SDK schema, and emits AIResource entities with AI Asset annotations.

## Requirements

### Requirement: Skillcard Blob Download

The connector MUST selectively download the `skillcard.yaml` blob from OCI images only when the manifest digest has changed.

#### Scenario: Skillcard layer identification

- **WHEN** the connector fetches an OCI manifest with multiple layers
- **THEN** it identifies the skillcard layer by:
  - OCI annotation `io.rhdh.skill.layer: skillcard` on the layer descriptor, OR
  - Layer media type `application/vnd.rhdh.skill.config.v1+yaml`, OR
  - Layer with filename annotation `io.rhdh.skill.filename: skillcard.yaml`
- **AND** if no layer is annotated, it assumes the first layer contains the skillcard (fallback convention)

#### Scenario: Blob download via digest

- **WHEN** the connector identifies the skillcard layer digest (e.g., `sha256:abc123...`)
- **THEN** it downloads the blob via `GET /v2/<name>/blobs/<digest>`
- **AND** it streams the response to avoid buffering large blobs in memory
- **AND** if the blob is gzip-compressed (media type `application/vnd.oci.image.layer.v1.tar+gzip`), it decompresses on-the-fly

#### Scenario: Selective download based on digest change

- **WHEN** the connector has cached digest `sha256:old123` for skill `quay.io/skills/my-skill:latest`
- **AND** the current manifest digest is `sha256:new456`
- **THEN** it downloads the skillcard blob for `sha256:new456`
- **AND** if the digest is unchanged (`sha256:old123`), it skips the download and reuses cached entity metadata

### Requirement: YAML Parsing and Schema Validation

The connector MUST parse `skillcard.yaml` and validate against the SDK's Zod schema from RHDHPLAN-1507 RHIDP-15258.

#### Scenario: Parse valid skillcard.yaml

- **WHEN** the connector downloads a blob containing:
  ```yaml
  name: code-reviewer
  version: 1.0.0
  description: Reviews code for quality issues
  runtime: node
  ```
- **THEN** it parses the YAML using a safe YAML parser (e.g., `js-yaml`)
- **AND** it validates the parsed object against the SDK's `SkillcardSchema` (Zod)
- **AND** the validation passes because all required fields are present

#### Scenario: Reject invalid skillcard with descriptive error

- **WHEN** the connector downloads a blob with missing required field `name`:
  ```yaml
  version: 1.0.0
  description: Reviews code
  ```
- **THEN** the SDK schema validator rejects the skillcard with error: `"name" is required`
- **AND** the connector logs the error with skill image reference and validation failure details
- **AND** it does not emit an entity for this skill
- **AND** it continues processing other skills without aborting the entire sync

#### Scenario: Reject malformed YAML

- **WHEN** the connector downloads a blob with invalid YAML syntax (e.g., unclosed quote, invalid indentation)
- **THEN** the YAML parser throws a parse error
- **AND** the connector logs the error with skill image reference and YAML syntax details
- **AND** it does not emit an entity for this skill

### Requirement: Entity Emission as AIResource with skill Type

The connector MUST emit catalog entities as `kind: AIResource` with `spec.type: skill` and RHDH AI Asset annotations.

#### Scenario: Emit AIResource entity from valid skillcard

- **WHEN** the connector successfully validates a skillcard for `quay.io/skills/code-reviewer:latest`
- **THEN** it builds an AIResource entity with:
  - `apiVersion: backstage.io/v1alpha1`
  - `kind: AIResource`
  - `metadata.name: code-reviewer`
  - `metadata.annotations['rhdh.io/ai-asset-category']: skill`
  - `metadata.annotations['rhdh.io/ai-asset-source']: oci://quay.io/skills/code-reviewer:latest`
  - `metadata.annotations['rhdh.io/ai-asset-digest']: sha256:abc123...`
  - `spec.type: skill`
  - `spec.owner: team-ai` (from skillcard or default)

#### Scenario: Populate entity metadata from skillcard fields

- **WHEN** the skillcard contains `owner: team-ai`, `tags: [code-quality, review]`, `links: [{url: https://docs.example.com, title: Documentation}]`
- **THEN** the emitted entity includes:
  - `spec.owner: team-ai`
  - `metadata.tags: [code-quality, review]`
  - `metadata.links: [{url: https://docs.example.com, title: Documentation}]`

#### Scenario: Default entity values for missing optional fields

- **WHEN** the skillcard does not specify `owner` or `tags`
- **THEN** the emitted entity uses default values:
  - `spec.owner: unknown` (or configurable default from `oci.defaults.owner`)
  - `metadata.tags: []` (empty array)

### Requirement: Annotation Population

The connector MUST populate RHDH AI Asset annotations as defined in RHDHPLAN-1507 RHIDP-15258.

#### Scenario: Populate OCI registry reference annotation

- **WHEN** the connector emits an entity for skill `quay.io/skills/my-skill:latest`
- **THEN** it sets `metadata.annotations['rhdh.io/ai-asset-source']: oci://quay.io/skills/my-skill:latest`
- **AND** the annotation uses the `oci://` scheme to indicate OCI artifact source

#### Scenario: Populate manifest digest annotation

- **WHEN** the connector fetches manifest with digest `sha256:abc123...`
- **THEN** it sets `metadata.annotations['rhdh.io/ai-asset-digest']: sha256:abc123...`
- **AND** this digest is used for incremental sync change detection

#### Scenario: Populate ai-asset-category annotation

- **WHEN** the connector emits any skill entity
- **THEN** it sets `metadata.annotations['rhdh.io/ai-asset-category']: skill`
- **AND** this annotation enables filtering in the AI Asset catalog UI

### Requirement: Invalid Skill Rejection Without Sync Abort

The connector MUST reject invalid skills individually without aborting the entire sync process.

#### Scenario: Continue sync after rejecting one invalid skill

- **WHEN** the connector processes 100 skills and skill #42 has invalid YAML
- **THEN** it logs an error for skill #42 with details
- **AND** it continues processing skills #43-100 without interruption
- **AND** it emits entities for all valid skills (99 total)

#### Scenario: Aggregate error summary after sync

- **WHEN** the connector completes a sync with 5 invalid skills out of 100
- **THEN** it logs a summary: "Sync completed: 95 skills emitted, 5 skills rejected"
- **AND** it provides a list of rejected skill image references for troubleshooting
