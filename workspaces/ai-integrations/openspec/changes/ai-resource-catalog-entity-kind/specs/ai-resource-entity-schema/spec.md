## RHDH Extension Requirements for AIResource

RHDH extends the upstream `AiResource` / `AIResource` entity kind with RHDH-specific validation behavior. This spec covers only what this workspace adds on top of the upstream kind definition.

Upstream has no `spec.location` field. Asset content location uses the standard `backstage.io/source-location` annotation.

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

### Requirement: No RHDH `spec.location` field

RHDH SHALL NOT require or validate a `spec.location` struct for AIResource asset location. Git/HTTPS and OCI content references use `backstage.io/source-location` only.

#### Scenario: Entity without `spec.location` accepted

- **WHEN** an AIResource entity omits `spec.location` and provides a valid `backstage.io/source-location`
- **THEN** the entity passes RHDH extension validation for location concerns

#### Scenario: `spec.location` is not the OCI validation input

- **WHEN** an AIResource entity includes a legacy `spec.location` field
- **THEN** RHDH OCI format validation does not treat `spec.location.target` as the source of truth (validation is based on `backstage.io/source-location`)

---

### Requirement: OCI source-location URI scheme

When an AIResource entity declares `backstage.io/source-location` whose location-ref target uses the `oci://` scheme, the annotation SHALL use the Backstage location-ref form `url:oci://…`, and the target SHALL be a well-formed OCI reference.

#### Scenario: Valid OCI source-location accepted

- **WHEN** an AIResource entity declares `backstage.io/source-location: url:oci://quay.io/myorg/my-skills:latest`
- **THEN** the entity passes OCI format validation

#### Scenario: Valid OCI digest source-location accepted

- **WHEN** an AIResource entity declares `backstage.io/source-location: url:oci://quay.io/myorg/my-skills@sha256:<digest>`
- **THEN** the entity passes OCI format validation

#### Scenario: OCI target without `oci://` scheme rejected

- **WHEN** an AIResource entity declares `backstage.io/source-location: url:quay.io/myorg/my-skills:latest` intending an OCI asset
- **THEN** the catalog does not treat it as a valid OCI source-location (no `oci://` target scheme)

#### Scenario: Bare `oci://` annotation without `url:` prefix rejected

- **WHEN** an AIResource entity declares `backstage.io/source-location: oci://quay.io/myorg/my-skills:latest`
- **THEN** the catalog rejects it with an actionable error stating that the location-ref form `url:oci://…` is required

#### Scenario: Malformed OCI target rejected

- **WHEN** an AIResource entity declares `backstage.io/source-location: url:oci://` or another malformed OCI reference
- **THEN** the catalog rejects it with an error describing the expected `oci://registry/repository[:tag|@digest]` format

#### Scenario: Non-OCI source-location is not subject to OCI validation

- **WHEN** an AIResource entity declares `backstage.io/source-location: url:https://github.com/myorg/my-skills`
- **THEN** the OCI format rules do not apply

---

### Requirement: Validation error quality

RHDH-specific validation errors SHALL include the field path (or annotation name), the invalid value, and a human-readable description of the violated constraint. Errors SHALL NOT expose internal class names or stack traces.

#### Scenario: `spec.scope` error is actionable

- **WHEN** an AIResource entity declares an invalid `spec.scope`
- **THEN** the error identifies `spec.scope`, the received value, and the accepted values

#### Scenario: OCI source-location error is actionable

- **WHEN** an AIResource entity provides a malformed OCI `backstage.io/source-location`
- **THEN** the error states the expected `url:oci://…` format without exposing internal implementation details

#### Scenario: Multiple extension errors reported together

- **WHEN** an AIResource entity violates multiple RHDH extension constraints
- **THEN** all errors are reported in a single response rather than stopping at the first error
