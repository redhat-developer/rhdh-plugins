## ADDED Requirements

### Requirement: Git-backed entity ingestion via existing URL reader

AIResource entities with `spec.location.type: git` SHALL be ingested using the standard Backstage `UrlReaderProcessor`. The entity SHALL declare `metadata.annotations["backstage.io/source-location"]` pointing to the repository URL.

#### Scenario: Git entity with source-location annotation ingested

- **WHEN** an AIResource entity declares `spec.location.type: git` and the annotation `backstage.io/source-location` set to a valid repository URL
- **THEN** the catalog reads and ingests the entity using the existing URL reader without errors

#### Scenario: Missing source-location annotation produces warning

- **WHEN** an AIResource entity declares `spec.location.type: git` but omits the `backstage.io/source-location` annotation
- **THEN** the catalog ingests the entity but emits a processor warning indicating the annotation is missing

---

### Requirement: OCI-backed entity format validation

AIResource entities with `spec.location.type: oci` SHALL be validated by an RHDH catalog processor for URI format only. The processor SHALL NOT make any network calls to a registry.

#### Scenario: Valid OCI reference accepted

- **WHEN** an AIResource entity declares `spec.location.type: oci` with a well-formed `oci://` URI in `spec.location.target`
- **THEN** the entity passes processor validation and is ingested without registry calls

#### Scenario: Malformed OCI reference rejected

- **WHEN** an AIResource entity declares `spec.location.type: oci` with a `spec.location.target` that does not match the expected `oci://` format
- **THEN** the processor rejects it with a validation error describing the expected format and makes no registry call

---

### Requirement: AIResource entities registrable via standard catalog interfaces

AIResource entities SHALL be registrable through standard RHDH catalog registration interfaces, including manual URL registration and catalog-info auto-discovery.

#### Scenario: AIResource entity registered via standard URL registration flow

- **WHEN** a user registers an AIResource entity via the standard RHDH catalog URL registration UI
- **THEN** the entity is ingested and indexed within the normal catalog refresh cycle

#### Scenario: AIResource entity discovered through standard catalog-info flow

- **WHEN** an AIResource entity is declared in a standard catalog-info location reachable by the catalog
- **THEN** the catalog ingests it without requiring AIResource-specific registration logic

---

### Requirement: Schema validation with actionable error messages

The catalog processor SHALL validate every AIResource entity against the applicable schema before storing it. Validation errors SHALL include the field path, invalid value when applicable, and a human-readable description of the violated constraint.

#### Scenario: Missing required field produces field-specific error

- **WHEN** an AIResource entity is missing a required field such as `spec.owner`
- **THEN** the validation error identifies the exact field path and states that it is required

#### Scenario: Invalid location type produces enumeration error

- **WHEN** an AIResource entity declares `spec.location.type: zip`
- **THEN** the validation error states the received value and lists the accepted values `git` and `oci`

#### Scenario: Multiple validation errors reported together

- **WHEN** an AIResource entity has multiple invalid fields
- **THEN** all validation errors are reported in a single response
