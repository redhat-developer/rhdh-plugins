## ADDED Requirements

### Requirement: Public Quay skill discovery

The OCI connector SHALL discover repositories in a configured public Quay
organization using pagination. When `quayDiscovery.tag` is omitted or blank, it
SHALL enumerate all active tags for each repository using paginated tag listing.
When a tag is supplied, it SHALL select that exact tag, including `latest`;
wildcard and regex matching SHALL NOT be supported. It SHALL refresh at startup and on a non-overlapping Backstage schedule,
with a default interval of ten minutes. It SHALL resolve each selected tag once,
fetch its manifest by SHA-256 digest, and verify the returned bytes before using
metadata or fetching layers. The stable record key SHALL be registry host plus
repository and the exact case-sensitive tag (`<registry>/<repository>:<tag>`),
excluding the manifest digest. Different tags SHALL remain distinct even when
they resolve to the same digest. Only candidates confirmed to contain valid
skill content SHALL produce normalized records and catalog entries.

#### Scenario: Omitted tag discovers all active tags

- **WHEN** no tag is configured and a repository has active tags `latest`, `v1`, and `v2`
- **THEN** the connector examines each distinct tagged reference, including tags from later pages
- **AND** inactive historical tags and untagged manifests are not enumerated
- **AND** repeated references are deduplicated without collapsing different tags that share a digest

#### Scenario: Exact tag preserves the former default

- **WHEN** `tag: latest` is explicitly configured
- **THEN** discovery tries only `latest` in each repository without listing all tags
- **AND** a missing selected tag does not trigger fallback to a different tag

#### Scenario: Shared discovery bounds and ordering

- **WHEN** discovery enumerates repository and tag pages
- **THEN** both page types share one discovery-page budget and the same request timeout, retry, cancellation, and response-size controls
- **AND** repeated repository tokens and tag pages making no progress stop traversal with diagnostics
- **AND** repository traversal and collected tagged references use deterministic Unicode code-point ordering
- **AND** the existing raw `/images` path reports truncation in logs while normalized snapshot completeness remains governed by design D6

#### Scenario: Two tags share a manifest

- **WHEN** `latest` and `v1` in the same repository resolve to the same valid skill-image manifest
- **THEN** normalized results contain two distinct repository/tag keys with the same digest-addressed source URI
- **AND** neither reference is discarded as a duplicate of the other

#### Scenario: Moving tag

- **WHEN** a tag changes after resolution during a refresh
- **THEN** the connector uses only the resolved manifest and its referenced blobs
- **AND** the published record's `sourceUri` and `digest` identify that manifest
- **AND** the repository/tag key remains stable when that tag later moves to new content

#### Scenario: Manifest integrity mismatch

- **WHEN** fetched manifest bytes do not match the resolved digest
- **THEN** no record for that candidate is published in the attempt
- **AND** the repository/tag key is reported as failed in a `partial` snapshot

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
- **AND** it reports the repository/tag key as failed in a `partial` snapshot

#### Scenario: Confirmed non-skill

- **WHEN** inspection completes successfully within bounds and the image lacks the required pair of skill files
- **THEN** the connector skips it and increments its non-skill counter
- **AND** no catalog entry is created for that tag
- **AND** other tags in the same repository are still inspected
- **AND** that skip alone does not make the snapshot incomplete

#### Scenario: Unsafe or oversized archive

- **WHEN** a candidate exceeds an extraction limit or contains an unsafe extraction path
- **THEN** the connector rejects the candidate without writing outside extraction storage
- **AND** it reports the repository/tag key as failed in a `partial` snapshot

### Requirement: Normalized OCI REST snapshots

The connector SHALL expose authenticated `GET /skills/:sourceId` using the
shared v1 contract and design D3 metadata mappings, with source type `oci`.
It SHALL publish snapshots atomically according to design D6, report known
failed repository/tag keys, and retain the existing #4747 `/images` response format.
It SHALL NOT emit `AiResource` entities or apply catalog defaults or mutations.
Unknown source IDs SHALL return 404.

#### Scenario: Normalized and raw endpoints coexist

- **WHEN** a configured skill is successfully extracted
- **THEN** `/skills/:sourceId` returns a normalized record with a digest-addressed OCI URI
- **AND** the existing `/images` endpoint retains its raw-content response format
- **AND** the normalized endpoint contains no raw YAML, Markdown, or local paths

#### Scenario: Refresh fails for one tag

- **WHEN** one repository/tag fails while other tags are successfully processed
- **THEN** the connector publishes successful records with `status: partial` and the failed repository/tag key
- **AND** it makes no catalog mutation itself

### Requirement: Configurable acquisition with shared request handling

The task 2.1 acquisition path SHALL accept the optional backend-only timeout,
blob/decompressed-layer, retained-content, discovery-response, image-count, retry-count, and
retry-delay settings described in design D7. Absent settings SHALL use the shared
defaults; invalid supplied numeric values SHALL fail configuration validation.
A retry count of zero SHALL disable transient retries. The connector SHALL
validate any supplied exact OCI tag when reading discovery configuration. An
omitted, null, or blank tag SHALL enable all-active-tag discovery; other supplied
non-string values and invalid OCI tag syntax SHALL fail validation.

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
- **AND** each distinct discovered repository/tag consumes a candidate slot, including aliases of the same digest
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
