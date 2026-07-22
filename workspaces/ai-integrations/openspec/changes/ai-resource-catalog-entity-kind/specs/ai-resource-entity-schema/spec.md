## RHDH Extension Requirements for AIResource

RHDH extends the upstream `AIResource` entity kind with RHDH-specific validation behavior. This spec covers only what this workspace adds on top of the upstream kind definition.

---

### Requirement: `spec.scope` field

RHDH AIResource entities MAY declare `spec.scope` to indicate the intended audience of the AI asset. Valid values are `organization`, `product`, and `team`. The field is optional.

#### Scenario: Valid scope accepted

- **WHEN** an AIResource entity declares `spec.scope: organization`
- **THEN** the catalog ingests it without error

#### Scenario: Additional valid scope values accepted

- **WHEN** an AIResource entity declares `spec.scope: product` or `spec.scope: team`
- **THEN** the catalog ingests it without error

#### Scenario: Omitted scope accepted

- **WHEN** an AIResource entity omits `spec.scope`
- **THEN** the catalog ingests it without error

#### Scenario: Invalid scope rejected with actionable error

- **WHEN** an AIResource entity declares `spec.scope` with a value other than `organization`, `product`, or `team`
- **THEN** the catalog rejects it with a validation error that names `spec.scope`, the received value, and the accepted values

---

### Requirement: OCI location URI scheme

When `spec.location.type` is `oci`, the `spec.location.target` value SHALL begin with the `oci://` scheme prefix.

#### Scenario: Valid OCI target accepted

- **WHEN** an AIResource entity declares `spec.location.type: oci` and `spec.location.target: oci://quay.io/myorg/my-skills:latest`
- **THEN** the entity passes validation

#### Scenario: OCI target without prefix rejected

- **WHEN** an AIResource entity declares `spec.location.type: oci` and `spec.location.target: quay.io/myorg/my-skills:latest`
- **THEN** the catalog rejects it with an error stating that the `oci://` prefix is required and shows the expected format

#### Scenario: Git type is not subject to OCI prefix validation

- **WHEN** an AIResource entity declares `spec.location.type: git` with a normal repository URL in `spec.location.target`
- **THEN** the `oci://` rule does not apply

---

### Requirement: Validation error quality

RHDH-specific validation errors SHALL include the field path, the invalid value, and a human-readable description of the violated constraint. Errors SHALL NOT expose internal class names or stack traces.

#### Scenario: `spec.scope` error is actionable

- **WHEN** an AIResource entity declares an invalid `spec.scope`
- **THEN** the error identifies `spec.scope`, the received value, and the accepted values

#### Scenario: OCI target error is actionable

- **WHEN** an AIResource entity with `spec.location.type: oci` provides a malformed `spec.location.target`
- **THEN** the error states the expected `oci://` format without exposing internal implementation details

#### Scenario: Multiple extension errors reported together

- **WHEN** an AIResource entity violates multiple RHDH extension constraints
- **THEN** all errors are reported in a single response rather than stopping at the first error
