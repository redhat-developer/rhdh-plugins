# OCI Registry Discovery and Manifest Fetching

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Connects to OCI-compliant registries, discovers skill repositories via tag listing, fetches image manifests, and extracts metadata annotations — all without vendor-specific SDKs.

## Requirements

### Requirement: OCI Distribution Spec Tag Listing

The connector MUST discover skill repositories by listing tags from configurable OCI registries using the `GET /v2/<name>/tags/list` endpoint.

#### Scenario: Registry connection and tag listing

- **WHEN** the connector is configured with `catalog.providers.ociSkill.registries[0].url: https://quay.io` and `namespace: skills`
- **THEN** it sends `GET https://quay.io/v2/skills/<repository>/tags/list` for each repository in the namespace
- **AND** it parses the JSON response to extract tag names
- **AND** tag names are sorted by semantic version or creation time (registry-dependent)

#### Scenario: Namespace filtering

- **WHEN** the connector is configured with `catalog.providers.ociSkill.registries[0].namespace: skills/community`
- **THEN** it only lists tags for repositories under `skills/community/` prefix
- **AND** repositories outside this namespace are ignored

#### Scenario: Multiple registry support

- **WHEN** the connector is configured with multiple registries in `catalog.providers.ociSkill.registries[]`
- **THEN** it discovers skills from all configured registries in parallel
- **AND** skill entity references include the registry URL to avoid name collisions (e.g., `oci://quay.io/skills/my-skill` vs. `oci://harbor.internal/skills/my-skill`)

#### Scenario: Tag listing pagination

- **WHEN** a repository has more than 100 tags (registry default page size)
- **THEN** the connector follows pagination via the `Link` header or `last` query parameter (OCI Distribution Spec allows both)
- **AND** it fetches all pages until no more tags remain

### Requirement: OCI Manifest Fetching with Content Negotiation

The connector MUST fetch OCI image manifests using `GET /v2/<name>/manifests/<reference>` with proper content negotiation to support both OCI v1 and Docker v2 registries.

#### Scenario: Manifest fetching with OCI v1 content type

- **WHEN** the connector fetches a manifest from an OCI-compliant registry
- **THEN** it sends `Accept: application/vnd.oci.image.manifest.v1+json` in the request header
- **AND** the registry returns the manifest with `Content-Type: application/vnd.oci.image.manifest.v1+json`
- **AND** the connector extracts the manifest digest from the `Docker-Content-Digest` response header

#### Scenario: Manifest fetching with Docker v2 fallback

- **WHEN** the registry does not support OCI v1 media types
- **THEN** the connector falls back to `Accept: application/vnd.docker.distribution.manifest.v2+json`
- **AND** the registry returns the manifest with Docker v2 content type
- **AND** the connector extracts annotations from `config.Labels` instead of `annotations` field

#### Scenario: Parallel manifest fetching

- **WHEN** the connector discovers 100 skill repositories
- **THEN** it fetches manifests in parallel with configurable concurrency (default 20)
- **AND** it uses a concurrency limiter (e.g., `p-limit`) to avoid overwhelming the registry
- **AND** it completes all 100 manifest fetches within 10 seconds (assuming 50ms per fetch)

### Requirement: OCI Annotation Extraction

The connector MUST extract skill metadata from OCI manifest annotations without downloading blob content.

#### Scenario: Extract annotations from OCI v1 manifest

- **WHEN** the connector fetches an OCI v1 manifest
- **THEN** it extracts the `annotations` field from the manifest JSON
- **AND** it looks for skill-specific annotations like `io.rhdh.skill.name`, `io.rhdh.skill.version`, `io.rhdh.skill.description`
- **AND** it uses these annotations for entity metadata before downloading the full skillcard blob

#### Scenario: Extract labels from Docker v2 manifest

- **WHEN** the connector fetches a Docker v2 manifest
- **THEN** it extracts the `config` digest and fetches the config blob via `GET /v2/<name>/blobs/<digest>`
- **AND** it parses the `config.Labels` field for skill-specific metadata
- **AND** label keys follow the same convention as OCI annotations (e.g., `io.rhdh.skill.name`)

#### Scenario: Missing annotations gracefully handled

- **WHEN** an OCI manifest has no `annotations` field
- **THEN** the connector logs a warning but does not reject the skill
- **AND** it proceeds to download the skillcard blob to extract metadata from `skillcard.yaml` directly

### Requirement: Connection Error Handling

The connector MUST gracefully handle registry connection failures and provide actionable error messages.

#### Scenario: Registry unreachable

- **WHEN** the connector attempts to connect to `https://registry.example.com` but the host is unreachable
- **THEN** it logs an error with the registry URL and connection timeout details
- **AND** it marks the registry as unavailable and retries with exponential backoff (1s, 2s, 4s, 8s)
- **AND** it continues processing other configured registries without blocking

#### Scenario: Authentication failure

- **WHEN** the connector sends a request without valid credentials to a private registry
- **THEN** the registry returns HTTP 401 Unauthorized
- **AND** the connector logs an error indicating missing or invalid credentials
- **AND** it does not retry (authentication errors are not transient)

#### Scenario: Rate limiting

- **WHEN** the registry returns HTTP 429 Too Many Requests
- **THEN** the connector extracts the `Retry-After` header value (if present)
- **AND** it waits for the specified duration before retrying
- **AND** if no `Retry-After` header, it uses exponential backoff starting at 5 seconds
