## ADDED Requirements

### Requirement: Public Quay skill discovery

The OCI connector SHALL discover repositories in a configured public Quay
organization using pagination and select the configured tag or `latest` when
absent. It SHALL refresh at startup and on a non-overlapping Backstage schedule,
with a default interval of ten minutes. It SHALL resolve each selected tag once,
fetch its manifest by SHA-256 digest, and verify the returned bytes before using
metadata or fetching layers. The stable record key SHALL be registry host plus
repository, excluding tag and digest.

#### Scenario: Moving tag

- **WHEN** a tag changes after resolution during a refresh
- **THEN** the connector uses only the resolved manifest and its referenced blobs
- **AND** the published record's `sourceUri` and `digest` identify that manifest

#### Scenario: Manifest integrity mismatch

- **WHEN** fetched manifest bytes do not match the resolved digest
- **THEN** no record for that candidate is published in the attempt
- **AND** the repository key is reported as failed in a `partial` snapshot

### Requirement: Bounded skill metadata extraction

The connector SHALL build on PR #4747's acquisition and support annotated file
layers and tar/tar+gzip layouts containing `skill.yaml` or `skillimage.yaml` plus
`SKILL.md` or `SKILLS.md`. It SHALL accept exactly one matching SkillCard and one
matching Markdown document across supported layers; multiple matches SHALL be
rejected as an ambiguous candidate. It SHALL verify blob descriptors before parsing and
apply design D7's download, decompression, entry-count, path, timeout, and
concurrency bounds. Manifest metadata annotations SHALL NOT be required when
valid skill files are present. Extraction SHALL run only in the connector and
SHALL NOT execute skill content.

#### Scenario: skillctl archive without manifest metadata annotations

- **WHEN** an image contains valid SkillCard and Markdown files in a verified tar layer
- **THEN** the connector normalizes those files according to design D3
- **AND** the absence of manifest metadata annotations does not suppress the skill

#### Scenario: Ambiguous skill files

- **WHEN** an image has multiple matching SkillCards or Markdown documents, including duplicate archive entries or competing supported layouts
- **THEN** the connector publishes no record for that candidate
- **AND** it reports the repository key as failed in a `partial` snapshot

#### Scenario: Confirmed non-skill

- **WHEN** inspection completes successfully within bounds and the image lacks the required pair of skill files
- **THEN** the connector skips it and increments its non-skill counter
- **AND** that skip alone does not make the snapshot incomplete

#### Scenario: Unsafe or oversized archive

- **WHEN** a candidate exceeds an extraction limit or contains an unsafe extraction path
- **THEN** the connector rejects the candidate without writing outside extraction storage
- **AND** it reports the repository key as failed in a `partial` snapshot

### Requirement: Normalized OCI REST snapshots

The connector SHALL expose authenticated `GET /skills/:sourceId` using the
shared v1 contract and design D3 metadata mappings, with source type `oci`.
It SHALL publish snapshots atomically according to design D6, report known
failed repository keys, and retain the existing #4747 `/images` response format.
It SHALL NOT emit `AiResource` entities or apply catalog defaults or mutations.
Unknown source IDs SHALL return 404.

#### Scenario: Normalized and raw endpoints coexist

- **WHEN** a configured skill is successfully extracted
- **THEN** `/skills/:sourceId` returns a normalized record with a digest-addressed OCI URI
- **AND** the existing `/images` endpoint retains its raw-content response format
- **AND** the normalized endpoint contains no raw YAML, Markdown, or local paths

#### Scenario: Refresh fails for one repository

- **WHEN** one repository fails while others are successfully processed
- **THEN** the connector publishes successful records with `status: partial` and the failed repository key
- **AND** it makes no catalog mutation itself

### Requirement: Configurable acquisition with shared request handling

The task 2.1 acquisition path SHALL accept the optional backend-only timeout,
blob/decompressed-layer, retained-content, discovery-response, image-count, retry-count, and
retry-delay settings described in design D7. Absent settings SHALL use the shared
defaults; invalid supplied numeric values SHALL fail configuration validation.
A retry count of zero SHALL disable transient retries. The connector SHALL
validate the selected OCI tag when reading discovery configuration.

Quay discovery and OCI acquisition SHALL share redirect handling, unused-body
cleanup, bounded response reading, and request-deadline handling. Discovery and
image processing SHALL share transient-error classification and backoff, while
preserving their separate retry units (one page and one image acquisition).

#### Scenario: Optional limits and overrides

- **WHEN** an operator omits tuning settings
- **THEN** acquisition uses the documented default values
- **AND** a supplied override applies at every corresponding acquisition boundary
- **AND** the retained-content budget counts UTF-8 skill YAML and Markdown across accepted images

#### Scenario: Configurable total candidate limit

- **WHEN** an operator sets `skillImageConnector.maxImages` to 100 and discovery returns 75 unique candidates
- **THEN** all 75 candidates can be attempted rather than being truncated to the default of 25
- **AND** the total includes explicit images, which take priority over discovered candidates
- **AND** discovered references already present in the explicit list consume no additional slots
- **AND** missing tags still count toward candidates attempted, and concurrency remains capped at four

#### Scenario: Enforcing the candidate limit

- **WHEN** the combined candidate list exceeds the configured `maxImages` limit
- **THEN** excess discovered candidates are skipped with a warning
- **AND** an explicit image list exceeding the limit fails startup validation
- **AND** an omitted limit defaults to 25, while nonpositive, fractional, or unsafe integer limits fail validation

#### Scenario: Timeout recovery and shutdown

- **WHEN** a discovery attempt times out and retries remain
- **THEN** the next attempt receives a fresh request deadline
- **AND** redirects, authentication when applicable, and body reading stay within a request's deadline
- **AND** parent cancellation stops requests and backoff without further retries

#### Scenario: Unsafe redirect or oversized discovery response

- **WHEN** discovery receives a redirect rejected by the shared OCI redirect checks or a response exceeding its byte limit
- **THEN** discovery rejects it and releases unused response resources
- **AND** the existing raw-content `/images` failure behavior is retained

#### Scenario: Wrapped transient network failure

- **WHEN** fetch reports a transient network error through an underlying cause
- **THEN** the shared retry policy recognizes its error code and retries within the configured budget
- **AND** validation, size-limit, and parent-cancellation failures are not retried

#### Scenario: Missing tag on a discovered image

- **WHEN** acquisition of a discovered image returns HTTP 404
- **THEN** the connector logs the failure only at debug level
- **AND** an explicitly configured reference retains error diagnostics, including when discovery finds the same reference
- **AND** non-404 failures and organization-listing failures remain visible
- **AND** the existing `/images` failure list and status calculation are preserved
