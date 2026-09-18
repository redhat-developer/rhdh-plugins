## ADDED Requirements

### Requirement: Shared normalized skill contract

The `skills-common` library SHALL define and validate the `SkillRecord` and `SkillSnapshot` v1
schemas in design D2 for both connectors and the common catalog provider. It
SHALL provide pure normalization, identity, and reference helpers without owning
catalog mutations, runtime storage, or scheduled tasks. Connectors SHALL emit
normalized records, not `AiResource` entities or raw native files, on
`GET /skills/:sourceId`.

#### Scenario: Equivalent records from different sources

- **WHEN** OCI and npx connectors return valid v1 records
- **THEN** both responses pass the same shared snapshot validator
- **AND** the common provider maps them without parsing SkillCard YAML or Markdown

#### Scenario: Missing optional metadata

- **WHEN** a source supplies a valid key, name, URI, and digest but no license or authors
- **THEN** its record remains valid with those optional fields omitted

### Requirement: Explicit metadata normalization

Connectors SHALL follow the native-to-normalized mapping and ordered precedence
in design D3. The shared library SHALL validate normalized types and preserve the explicitly
mapped `extensions.oci` or `extensions.npx` fields. Unknown native metadata SHALL
NOT become arbitrary entity fields or annotations. Authors SHALL NOT imply
catalog ownership and SkillCard namespaces SHALL NOT override catalog namespaces.

#### Scenario: Conflicting declared versions

- **WHEN** an OCI SkillCard declares `metadata.version: 1.0.0` and its Markdown frontmatter declares `metadata.version: "1.0"`
- **THEN** the normalized record contains `version: "1.0.0"`

#### Scenario: Source-specific metadata

- **WHEN** an OCI SkillCard includes `metadata.namespace` and `spec.prompt`
- **THEN** the response preserves them as `extensions.oci.namespace` and `extensions.oci.prompt`
- **AND** neither value is copied into the catalog namespace or a new entity spec field

### Requirement: Snapshot completeness and validation

The shared library SHALL enforce design D2/D6's source identity, schema version, size/count,
status, timestamps, unique record keys, and disjoint successful/failed key sets.
`loading` SHALL have empty arrays and a null observation time. Completed attempts
SHALL have a UTC observation time. `ready` SHALL mean all discovery pages and
supported candidates completed without failures or limits; its failed-key list
SHALL be empty. `partial` SHALL mean discovery or processing was incomplete,
even if no failed keys are known. `failed` SHALL have no skill records.

#### Scenario: Later discovery page fails

- **WHEN** a connector retrieves one discovery page but cannot retrieve the next
- **THEN** it publishes `partial` with only successfully normalized records
- **AND** it does not claim that the missing candidates are absent

#### Scenario: Snapshot limit reached

- **WHEN** discovery would exceed 1,000 records or 5 MiB of serialized snapshot JSON
- **THEN** the connector returns a bounded `partial` response
- **AND** it does not publish a truncated `ready` response

#### Scenario: Unsupported schema or inconsistent status

- **WHEN** a response uses an unsupported schema version or claims `ready` with failed keys
- **THEN** shared validation rejects the snapshot

#### Scenario: Discovery budget exhausted by non-skills

- **WHEN** a refresh reaches design D7's total deadline, page/candidate budget, or a repeated pagination token before completing discovery
- **THEN** the connector stops acquisition and publishes a bounded `partial` snapshot
- **AND** skipped and failed candidates count toward the candidate budget

### Requirement: Stable identity and serialized references

The shared library SHALL implement design D5's identity tuple and deterministic catalog name,
SemVer fallback, and source-reference construction/parsing. OCI URI digests SHALL
match the record digest. HTTPS artifact URLs SHALL contain neither credentials
nor fragments; npx references SHALL serialize as `<sourceUri>#<digest>` with a
lowercase SHA-256 digest and round-trip without losing URL query parameters.

#### Scenario: Display name or content changes

- **WHEN** a record's name or digest changes but its source type, source ID, and key do not
- **THEN** its computed catalog entity name remains identical

#### Scenario: Missing declared semantic version

- **WHEN** a record has no valid declared semantic version after removal of one leading `v`
- **THEN** its catalog version is `0.0.0+<first-12-hex-digits-of-record.digest>`

#### Scenario: npx reference round trip

- **WHEN** a verified artifact URL includes a query string
- **THEN** constructing and parsing its npx reference preserves the serialized URL, query order, and digest
