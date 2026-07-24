## ADDED Requirements

### Requirement: Entity YAML ingested via standard catalog locations

AIResource entity descriptors SHALL be registered through standard Backstage/RHDH catalog locations (`url`, `file`, or git discovery). Registration SHALL NOT require a catalog location type `oci` or an OCI `UrlReader`.

#### Scenario: Entity registered via standard URL registration flow

- **WHEN** a user registers an AIResource `catalog-info.yaml` via the standard RHDH catalog URL registration UI
- **THEN** the entity is ingested and indexed within the normal catalog refresh cycle

#### Scenario: Entity discovered through standard catalog-info flow

- **WHEN** an AIResource entity is declared in a standard catalog-info location reachable by the catalog
- **THEN** the catalog ingests it without requiring AIResource-specific registration logic

---

### Requirement: Git/HTTPS-backed content via source-location

AIResource entities whose content lives in git/HTTPS SHALL declare `metadata.annotations["backstage.io/source-location"]` with a normal `url:https://…` (or other UrlReader-compatible) location-ref. Entity YAML ingestion continues to use the existing `UrlReaderProcessor` for catalog locations.

#### Scenario: Git entity with source-location annotation ingested

- **WHEN** an AIResource entity declares `backstage.io/source-location: url:https://github.com/my-org/my-skills`
- **THEN** the catalog ingests the entity without errors

#### Scenario: Missing source-location annotation produces warning

- **WHEN** an AIResource entity omits the `backstage.io/source-location` annotation
- **THEN** the catalog ingests the entity but emits a processor warning indicating the annotation is missing (standard catalog behavior)

---

### Requirement: OCI-backed source-location format validation

When an AIResource entity's `backstage.io/source-location` target uses the `oci://` scheme, an RHDH catalog processor SHALL validate URI/location-ref format only. The processor SHALL NOT make any network calls to a registry.

#### Scenario: Valid OCI source-location accepted

- **WHEN** an AIResource entity declares `backstage.io/source-location: url:oci://quay.io/org/skills:latest`
- **THEN** the entity passes processor validation and is ingested without registry calls

#### Scenario: Malformed OCI source-location rejected

- **WHEN** an AIResource entity declares a malformed OCI `backstage.io/source-location` (including bare `oci://…` without the `url:` prefix)
- **THEN** the processor rejects it with a validation error describing the expected `url:oci://…` format and makes no registry call

#### Scenario: Zero registry I/O during OCI validation

- **WHEN** the OCI processor validates any OCI source-location value
- **THEN** it performs no HTTP or registry network calls

---

### Requirement: Schema validation with actionable error messages

The catalog processor SHALL validate every AIResource entity against the applicable schema before storing it. Validation errors SHALL include the field path (or annotation name), invalid value when applicable, and a human-readable description of the violated constraint.

#### Scenario: Missing required upstream field produces field-specific error

- **WHEN** an AIResource entity is missing a required upstream field such as `spec.owner`
- **THEN** the validation error identifies the exact field path and states that it is required

#### Scenario: Invalid `spec.scope` produces enumeration error

- **WHEN** an AIResource entity declares an invalid `spec.scope`
- **THEN** the validation error states the received value and lists the accepted values `organization`, `product`, and `team`

#### Scenario: Multiple validation errors reported together

- **WHEN** an AIResource entity has multiple invalid fields or annotations
- **THEN** all validation errors are reported in a single response
