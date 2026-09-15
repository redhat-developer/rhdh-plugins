## ADDED Requirements

### Requirement: Shared skill entity construction

The SDK SHALL construct an upstream-compatible `AiResource` for each skill,
with `spec.type: skill`, `backstage.io/source-location`, and the non-empty
`rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, and
`rhdh.io/ai-asset-source` annotations. The category SHALL be `skill`.

#### Scenario: Missing declared version

- **WHEN** a verified source provides no valid semantic version
- **THEN** the SDK sets the version annotation to
  `0.0.0+<short-content-digest>`

### Requirement: Stable identities and source failure isolation

The SDK SHALL derive an entity identity from the configured provider ID and
stable source identity. It SHALL persist last-known-good identities and digests,
use delta mutations, retain an entity after an individual transient source
failure, and remove it only after successful discovery proves its absence.

#### Scenario: Individual source lookup fails

- **WHEN** one known skill cannot be retrieved during an otherwise successful
  sync
- **THEN** the provider logs contextual failure information and retains the
  last-known-good entity while processing remaining skills
