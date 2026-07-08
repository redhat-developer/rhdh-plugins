# OCI Artifact Fetching and Validation

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

The OCI Skill Registry connector fetches OCI image manifests from OCI-compliant registries, downloads the `skillcard.yaml` blob from image layers, validates it against the SDK schema, and emits Backstage `Resource` entities with `spec.type: ai-skill`. Invalid artifacts are rejected with descriptive logs without aborting the sync of other skills.

## ADDED Requirements

### Requirement: Fetch OCI Image Manifests

The connector calls the OCI Distribution Spec API to retrieve image manifests for all tags in a configured namespace.

#### Scenario: List tags in a namespace

- **WHEN** the connector runs a sync cycle for registry `quay.io` namespace `myorg/skills`
- **THEN** it calls `GET /v2/myorg/skills/tags/list`
- **AND** receives JSON response with `tags` array: `["v1.0.0", "v1.1.0", "latest"]`

#### Scenario: Fetch manifest for a tag

- **WHEN** the connector processes tag `v1.0.0`
- **THEN** it calls `GET /v2/myorg/skills/manifests/v1.0.0` with `Accept: application/vnd.oci.image.manifest.v1+json`
- **AND** receives manifest JSON with `layers` array containing blob digests

#### Scenario: Handle registry API errors

- **WHEN** the manifest fetch returns HTTP 404
- **THEN** the connector logs warning: `Tag myorg/skills:v1.0.0 not found, skipping`
- **AND** continues processing other tags without aborting the sync

### Requirement: Download `skillcard.yaml` from Image Layers

The connector downloads layer blobs and extracts the `skillcard.yaml` file.

#### Scenario: Extract skillcard from tarball layer

- **WHEN** the manifest has a layer with `mediaType: application/vnd.oci.image.layer.v1.tar+gzip` and `digest: sha256:abc123...`
- **THEN** the connector calls `GET /v2/myorg/skills/blobs/sha256:abc123...`
- **AND** streams the blob through gzip decompression and tar extraction
- **AND** locates the `skillcard.yaml` entry in the tar stream
- **AND** reads the YAML content into memory

#### Scenario: Missing skillcard.yaml

- **WHEN** none of the image layers contain a `skillcard.yaml` file
- **THEN** the connector logs error: `No skillcard.yaml found in myorg/skills:v1.0.0, rejecting artifact`
- **AND** does not emit an entity for this tag
- **AND** continues processing other tags

#### Scenario: Multiple layers with skillcard.yaml

- **WHEN** multiple layers contain a `skillcard.yaml` file (edge case: layered image)
- **THEN** the connector uses the first `skillcard.yaml` found in layer order
- **AND** logs warning: `Multiple skillcard.yaml files found in myorg/skills:v1.0.0, using first occurrence`

### Requirement: Validate `skillcard.yaml` Against SDK Schema

The connector validates the parsed YAML against the SDK schema, rejecting skills with missing required fields.

#### Scenario: Valid skillcard.yaml

- **WHEN** the `skillcard.yaml` contains all required fields:
  ```yaml
  name: pdf-processor
  description: Processes PDF documents
  tags: [pdf, document]
  version: 1.2.0
  authors: [team-ai]
  allowed-tools: [Read, Write, Bash]
  ```
- **THEN** the connector validates successfully
- **AND** proceeds to entity emission

#### Scenario: Missing required field

- **WHEN** the `skillcard.yaml` is missing the `name` field
- **THEN** the connector logs error: `Invalid skillcard.yaml in myorg/skills:v1.0.0: missing required field "name"`
- **AND** does not emit an entity for this tag
- **AND** continues processing other tags

#### Scenario: Invalid field type

- **WHEN** the `skillcard.yaml` has `version: 1.2` (number instead of string)
- **THEN** the connector logs error: `Invalid skillcard.yaml in myorg/skills:v1.0.0: field "version" must be a string`
- **AND** does not emit an entity for this tag

#### Scenario: Extra fields allowed

- **WHEN** the `skillcard.yaml` has additional fields not in the SDK schema (e.g., `internal-notes: "alpha release"`)
- **THEN** the connector validates successfully (extra fields are allowed for forward compatibility)
- **AND** proceeds to entity emission

### Requirement: Emit `Resource` Entities with AI Skill Annotations

The connector emits Backstage entities with `kind: Resource`, `spec.type: ai-skill`, and the required annotation set.

#### Scenario: Emit entity for valid skill

- **WHEN** the connector validates `skillcard.yaml` for tag `v1.2.0` with name `pdf-processor`
- **THEN** it emits a `Resource` entity with:
  - `metadata.name: pdf-processor`
  - `metadata.namespace: default` (from config)
  - `spec.type: ai-skill`
  - `metadata.annotations.rhdh.io/ai-asset-category: skill`
  - `metadata.annotations.rhdh.io/ai-asset-version: 1.2.0`
  - `metadata.annotations.rhdh.io/ai-asset-source: quay.io/myorg/skills`
  - `metadata.annotations.rhdh.io/oci-registry-url: https://quay.io`
  - `metadata.annotations.rhdh.io/oci-image-name: myorg/skills`
  - `metadata.annotations.rhdh.io/oci-digest: sha256:abc123...`
  - `metadata.annotations.rhdh.io/oci-tag: v1.2.0`

#### Scenario: Sanitize skill name for entity ref

- **WHEN** the `skillcard.yaml` has `name: PDF_Processor` (uppercase, underscore)
- **THEN** the connector sanitizes to `metadata.name: pdf-processor` (lowercase, hyphen)
- **AND** logs info: `Sanitized skill name "PDF_Processor" to "pdf-processor" for entity ref`

#### Scenario: Populate owner from skillcard authors

- **WHEN** the `skillcard.yaml` has `authors: [team-ai, john-doe]`
- **THEN** the connector sets `spec.owner: team-ai` (first author)
- **AND** adds `metadata.annotations.rhdh.io/ai-skill-authors: team-ai,john-doe` (all authors)

### Requirement: Support Tag Enumeration Discovery

The connector discovers all skill artifacts in a configured OCI namespace by enumerating tags.

#### Scenario: Discover all skills in namespace

- **WHEN** the connector is configured with namespace `myorg/skills` (single repository)
- **THEN** it calls `GET /v2/myorg/skills/tags/list`
- **AND** processes all returned tags, emitting one entity per valid tag

#### Scenario: Discover skills across multiple repositories

- **WHEN** the connector is configured with namespace pattern `myorg/skills/*` (multiple repositories)
- **THEN** it calls `GET /v2/_catalog` to list repositories matching `myorg/skills/*`
- **AND** for each matching repository, calls `GET /v2/<repo>/tags/list`
- **AND** processes all tags across all repositories

#### Scenario: Pagination of tag lists

- **WHEN** the `GET /v2/myorg/skills/tags/list` response includes `Link` header with `next` relation
- **THEN** the connector follows the pagination link to fetch the next page of tags
- **AND** continues until no `next` link is present
- **AND** processes all tags across all pages
