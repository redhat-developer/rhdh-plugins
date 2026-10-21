## ADDED Requirements

### Requirement: Public Quay skill discovery

The OCI connector SHALL discover repositories in a configured public Quay
organization using pagination. When `quayDiscovery.tag` is omitted or blank, it
SHALL enumerate all active tags for each repository using paginated tag listing.
When a tag is supplied, it SHALL select that exact tag, including `latest`;
wildcard and regex matching SHALL NOT be supported. It SHALL refresh immediately
at startup and every ten minutes by default on a non-overlapping Backstage
schedule; explicitly configured initial delays and manual trigger mode SHALL be
honored instead of forcing immediate startup acquisition. It SHALL resolve each
selected tag once,
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
The connector SHALL enforce design D7's origin and destination policy on the
address used by each upstream connection, including redirects.

#### Scenario: DNS changes after destination validation

- **WHEN** a registry or redirect hostname passes a public-address preflight check but resolves to a disallowed address when connecting
- **THEN** the connector prevents the request from reaching that disallowed destination
- **AND** an independent preflight DNS lookup alone does not satisfy the destination policy

#### Scenario: Registry redirects to an unconfigured public origin

- **WHEN** a registry or discovery response redirects to a different HTTPS origin outside the initial registry hostname/subdomain and port scope and not listed in that source’s `allowedOrigins` (`skillImageConnector.allowedOrigins` for the legacy flat source)
- **THEN** the connector rejects the redirect before resolving or connecting to that destination
- **AND** omission of `allowedOrigins` permits only the initial registry hostname and its subdomains on the same HTTPS port

#### Scenario: Registry uses a subdomain CDN

- **WHEN** an allowed source registry redirects to its original hostname or a subdomain of that hostname on the same HTTPS port
- **THEN** the connector permits that destination without a separate `allowedOrigins` entry
- **AND** this generic rule uses a dot-delimited hostname boundary anchored to the initial registry across all redirects
- **AND** public-address validation, pinned lookup, TLS verification, and cross-origin authorization stripping still apply
- **AND** sibling domains, suffix lookalikes, and different ports require explicit origin configuration

#### Scenario: External origin does not expand redirect trust

- **WHEN** an explicitly configured external origin redirects to one of its subdomains
- **THEN** that subdomain requires its own explicit origin configuration unless it independently matches the initial registry's domain/port scope

#### Scenario: Configured CDN redirect

- **WHEN** a registry redirects to an explicitly configured HTTPS CDN origin
- **THEN** the connector validates all DNS answers and restricts connection attempts to the validated public address set
- **AND** it preserves TLS hostname verification and strips authorization on the cross-origin redirect
- **AND** it permits at most five redirects

#### Scenario: Unreachable IPv6 destination with a validated IPv4 alternative

- **WHEN** DNS returns public IPv6 addresses before public IPv4 addresses and IPv6 connectivity is unavailable
- **THEN** the connector can connect using a validated IPv4 address from the same DNS response
- **AND** fallback does not perform an independent DNS lookup or use an unvalidated destination

#### Scenario: Token endpoint destination validation

- **WHEN** a registry requests a bearer token exchange
- **THEN** the token request uses the same public-address validation and pinned connection transport
- **AND** the token realm must match the registry host or the explicitly configured token realm
- **AND** token endpoint redirects are rejected, including same-origin redirects

#### Scenario: Streaming pinned response

- **WHEN** response headers arrive before the body finishes
- **THEN** the pinned connection remains usable until body consumption or cancellation
- **AND** the request deadline and parent cancellation continue to govern body reads

#### Scenario: skillctl archive without manifest metadata annotations

- **WHEN** an image contains valid SkillCard and Markdown files in a verified tar layer
- **THEN** the connector normalizes those files according to design D3
- **AND** the absence of manifest metadata annotations does not suppress the skill

#### Scenario: Skill files split across supported layouts

- **WHEN** a verified image contains one annotated raw SkillCard and one archived Markdown document, or the inverse
- **THEN** the connector extracts and normalizes that pair according to design D3
- **AND** annotated raw file descriptors are not parsed as tar archives merely because their media type says tar
- **AND** additional matching files in any supported layer make the candidate ambiguous

#### Scenario: Malformed Markdown frontmatter

- **WHEN** an extracted Markdown document has unclosed, invalid, scalar, or array YAML frontmatter
- **THEN** normalization reports a malformed candidate with frontmatter diagnostics and no normalized record
- **AND** sufficient SkillCard metadata does not hide the parsing failure
- **AND** absent or empty optional frontmatter remains valid when the SkillCard provides sufficient metadata

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

#### Scenario: Decompressed layer exceeds its configured ceiling

- **WHEN** a compressed layer expands beyond `maxBlobSizeBytes`, including during inspection of an image not yet classified as a skill
- **THEN** the connector stops decompression using a bounded output allocation and rejects that candidate
- **AND** it does not classify incomplete inspection as a confirmed non-skill
- **AND** the raw `/images` response includes that image in `failedImages`
- **AND** independent candidates continue unless a shared source bound or cancellation stops processing
- **AND** normalized snapshots report the known failed key as an incomplete result

### Requirement: Normalized OCI REST snapshots

The connector SHALL expose authenticated `GET /skills/:sourceId` using the
shared v1 contract and design D3 metadata mappings, with source type `oci`.
It SHALL publish snapshots atomically according to design D6, report known
failed repository/tag keys, and retain the existing #4747 `/images` response format.
It SHALL NOT emit `AiResource` entities or apply catalog defaults or mutations.
Unknown source IDs SHALL return 404. The JSON response SHALL contain an `error`
string; exact diagnostic wording is not a stable identifier or error code.
Raw Markdown SHALL NOT be included in `/skills/:sourceId` normalized records;
it is served through the dedicated Markdown endpoint defined below.

#### Scenario: Aggregate content rejection without a tagged key

- **WHEN** a successfully extracted bare-digest input exceeds the retained-content budget
- **THEN** the connector releases that extraction and marks acquisition incomplete
- **AND** the normalized snapshot is `partial`, even with no successful records or known tagged failure keys
- **AND** the connector does not invent a tag or treat the rejection as a successful raw-only exclusion

#### Scenario: Defensive normalization classification

- **WHEN** normalization classifies an extracted candidate as ambiguous
- **THEN** the connector releases its files and reports its known repository/tag key as failed in an incomplete snapshot
- **WHEN** normalization confirms a non-skill
- **THEN** the connector releases its files and skips it without marking acquisition incomplete
- **WHEN** normalization returns a normalized outcome without a record or an unsupported outcome
- **THEN** the connector releases its files and reports a candidate failure rather than silently publishing `ready`

#### Scenario: Normalized and raw endpoints coexist

- **WHEN** a configured skill is successfully extracted
- **THEN** `/skills/:sourceId` returns a normalized record with a digest-addressed OCI URI
- **AND** the existing `/images` endpoint retains its raw-content response format
- **AND** the normalized endpoint contains no raw YAML, Markdown, or local paths
- **AND** the `/skilldocs/:sourceId/:digest` endpoint serves the extracted Markdown separately

#### Scenario: Refresh fails for one tag

- **WHEN** one repository/tag fails while other tags are successfully processed
- **THEN** the connector publishes successful records with `status: partial` and the failed repository/tag key
- **AND** it makes no catalog mutation itself

#### Scenario: Initial loading and atomic periodic refresh

- **WHEN** the first scheduled refresh has not completed
- **THEN** the authenticated snapshot has status `loading`, empty arrays, and `observedAt: null`
- **WHEN** a subsequent refresh runs on the default ten-minute or configured schedule
- **THEN** GET continues to serve the preceding completed snapshot without triggering registry work
- **AND** the completed replacement is published atomically with its UTC completion time
- **AND** source refreshes do not overlap and independent sources refresh independently

#### Scenario: Shared image references across independent sources

- **WHEN** multiple sources retain raw extractions for the same `imageRef`
- **THEN** each source owns and cleans up only its own files
- **AND** each source publication atomically rebuilds the aggregate `/images` inventory, displaying the first configured successful source's content once
- **AND** `failedImages` excludes a reference successfully retained by any source
- **AND** a source refresh cannot remove another source's successful extraction or files
- **AND** shutdown cleans all retained extractions, including duplicates hidden by aggregation
- **AND** aggregate raw status is `loading` while any first refresh is incomplete, then `ready` when raw content exists; without content it is `failed` only if every source's raw acquisition failed

#### Scenario: Standard Backstage schedule configuration

- **WHEN** a source omits `schedule`
- **THEN** frequency defaults to ten minutes, initial delay to zero, and timeout to `max(2 * sourceOperationDeadlineMs, 60000)` milliseconds
- **WHEN** a source configures `schedule`
- **THEN** Backstage's standard parser requires `frequency` and `timeout`, accepts ISO or human-duration values, and also accepts cron or manual frequency
- **AND** supplied initial delays are honored, without a separate immediate acquisition
- **AND** manual frequency runs only on a scheduler trigger and does not automatically run at startup
- **AND** snapshots remain `loading` until their first completed refresh
- **AND** omitted scope becomes `local`, explicit `local` is accepted, and explicit `global` is rejected because caches are local
- **AND** the unreleased `refreshIntervalMinutes` field is rejected with a migration error directing configuration to `schedule`

#### Scenario: Partial discovery with no normalized successes

- **WHEN** discovery yields a usable result but a later page, candidate, or bound prevents completeness
- **THEN** completed-page candidates are retained and the normalized snapshot is `partial`, even with zero records
- **AND** known failed repository/tag keys are reported without inventing unknown tag keys
- **AND** a result is `failed` only when no usable discovery result can be obtained
- **AND** a genuinely complete empty inventory is `ready` with no failed keys

#### Scenario: Raw extraction succeeds but normalization fails

- **WHEN** extracted skill files are available but their metadata cannot be normalized
- **THEN** `/images` retains that raw extraction and can report `ready`
- **AND** `/skills/:sourceId` reports the known tagged failure without publishing an invalid record

#### Scenario: Explicit digest-only input

- **WHEN** a configured digest-only reference is successfully acquired
- **THEN** `/images` retains its extracted raw content
- **AND** normalized snapshots deliberately exclude it without inventing a tagged identity or failure key
- **AND** this exclusion alone does not make the normalized snapshot incomplete
- **AND** an otherwise complete digest-only inventory can be empty and `ready`
- **AND** replacing tagged inputs with digest-only inputs can remove those tagged records from the next complete snapshot and allow downstream ready-result removals

#### Scenario: Source configuration isolates redirect trust

- **WHEN** explicit `sources` entries are configured
- **THEN** every entry requires a unique nonblank stable `id` and owns its registry allowlist, exact HTTPS redirect origins, image/discovery configuration, and optional standard Backstage `schedule`
- **AND** another source's origins and the flat legacy origins do not grant it additional redirect trust
- **AND** invalid origin entries fail startup validation
- **AND** numeric acquisition limits remain top-level settings applied to each source
- **AND** mixing explicit sources with flat `images`, `quayDiscovery`, `allowedRegistries`, `allowedOrigins`, or `schedule` produces a warning naming ignored fields without logging their values
- **WHEN** only flat image/discovery configuration is present
- **THEN** it maps to source `default` with the legacy flat origin and schedule settings

#### Scenario: Authenticated source lookup preserves encoded identity

- **WHEN** a client requests an existing source with a URL-encoded path segment
- **THEN** routing decodes it once and literal percent sequences are not decoded again
- **AND** unknown source IDs return 404
- **AND** unauthenticated requests cannot read snapshots
- **AND** a service caller targets plugin ID `skill-image-connector` for its request token

### Requirement: Dedicated authenticated Markdown endpoint

The connector SHALL expose authenticated `GET /skilldocs/:sourceId/:digest`
relative to its Backstage plugin base URL, serving extracted skill Markdown for
TechDocs consumption as specified in design D8. The `sourceId` is the configured
source identity (one path segment). The `digest` is the verified manifest digest
(`sha256:<64 lowercase hex digits>`). The endpoint SHALL use Backstage's default
backend authentication, consistent with `/skills/:sourceId`, accepting valid
user or service credentials. It SHALL return the
extracted Markdown document with `Content-Type: text/markdown` when available.
It SHALL preserve the existing `/images` endpoint compatibility and keep raw
Markdown out of `/skills/:sourceId` normalized records.

#### Scenario: Successful Markdown retrieval

- **WHEN** a GET request is made to `/skilldocs/:sourceId/:digest` with a valid source ID and a known digest
- **THEN** the connector returns 200 with `Content-Type: text/markdown` and the extracted Markdown content
- **AND** the response includes an `ETag` header derived from the manifest digest

#### Scenario: Unknown source ID

- **WHEN** a GET request is made to `/skilldocs/:sourceId/:digest` with a source ID not configured for this connector
- **THEN** the connector returns 404
- **AND** it does not return successful empty documentation

#### Scenario: Unknown digest for a known source

- **WHEN** a GET request is made to `/skilldocs/:sourceId/:digest` with a valid source ID but an unrecognized digest
- **THEN** the connector returns 404
- **AND** it does not return successful empty documentation or a 200 with an empty body

#### Scenario: Content not yet available

- **WHEN** the connector is still loading or the Markdown for a known digest has not been extracted yet
- **THEN** the connector returns 404
- **AND** it does not return successful empty documentation

#### Scenario: Conditional request with matching ETag

- **WHEN** a GET request includes `If-None-Match` matching the current ETag for the digest
- **THEN** the connector returns 304 Not Modified with no body
- **AND** TechDocs caching avoids re-fetching and re-building unchanged documentation

#### Scenario: Same-digest tag aliases share documentation

- **WHEN** two tags in the same repository resolve to the same manifest digest
- **THEN** requests to `/skilldocs/:sourceId/:digest` return the same Markdown content for both entities
- **AND** each entity's `backstage.io/techdocs-ref` annotation uses the same digest-addressed URL

#### Scenario: Moving tag updates documentation

- **WHEN** a tag moves to a new manifest with different Markdown content
- **THEN** requests using the new manifest digest return the new Markdown
- **AND** the old digest's content remains available as long as any entity references it

### Requirement: Bounded Markdown content storage and lifecycle

The connector SHALL retain extracted Markdown content for skills with
last-known-good entities using bounded durable storage, as specified in design
D8. Content SHALL be stored per source, keyed by manifest digest. Total
retained content per source SHALL be bounded by the optional backend-only
`skillImageConnector.maxRetainedMarkdownSizeBytes` positive safe integer (default
50 MiB = 52,428,800 bytes), independently of D7's extraction setting
`maxAggregateContentSizeBytes`. Omission SHALL use that fixed retention default;
invalid values and startup limits below existing retained bytes SHALL fail
configuration validation. Retained unique digests SHALL be capped at 1,000 per
source. The connector SHALL recover retained content from
durable storage after restarts, consistent with design D6's durable
reconciliation recovery.

#### Scenario: Content retained through partial refresh

- **WHEN** a `partial` refresh omits a previously known skill
- **THEN** the Markdown content for that skill's digest remains available at `/skilldocs/:sourceId/:digest`
- **AND** the retained entity's TechDocs documentation continues to render

#### Scenario: Content retained after restart

- **WHEN** the connector restarts with durable storage containing retained Markdown
- **THEN** it recovers the content before serving documentation requests
- **AND** `/skilldocs/:sourceId/:digest` returns the recovered content for entities that reference those digests

#### Scenario: Content cleanup after acknowledged reconciliation

- **WHEN** the configured provider successfully applies a `ready` snapshot and durably commits its next ownership state
- **AND** the connector accepts that revision's acknowledgment according to D8
- **THEN** only content absent from both the acknowledged retained-digest set and the current snapshot is eligible for cleanup
- **AND** a ready connector snapshot alone never authorizes cleanup

#### Scenario: Recovery preserves newer unacknowledged content

- **WHEN** an acknowledgment has committed and a later publication stores a new digest before a restart
- **THEN** recovery preserves the new digest because the earlier acknowledgment did not authorize its deletion
- **AND** content protected by the snapshot at acknowledgment time also remains available

#### Scenario: Acknowledgment cleanup transaction fails

- **WHEN** acknowledgment persistence or an eligible content deletion fails before the transaction commits
- **THEN** neither the acknowledgment nor its content deletions are committed
- **AND** the same request can be retried after recovery without deleting protected content

#### Scenario: Database initialization fails

- **WHEN** the configured database cannot initialize, migrate, or recover revision and content state
- **THEN** connector startup fails instead of silently using volatile storage
- **AND** it does not publish unpersisted observations or reuse a revision after resetting its counter

#### Scenario: Provider outage or mutation failure

- **WHEN** the connector publishes newer snapshots while the provider is unavailable or a catalog mutation fails
- **THEN** previous Markdown remains available because no successful reconciliation acknowledgment permits its removal
- **AND** restart recovery preserves this retention state

#### Scenario: Admission would exceed retained storage bounds

- **WHEN** new Markdown would exceed `maxRetainedMarkdownSizeBytes` or the 1,000 retained-digest limit, or durable storage of that content fails
- **THEN** the connector excludes that new normalized record, reports its repository/tag failure key, and publishes `partial`
- **AND** existing retained content is not evicted and records using it remain eligible
- **AND** repeated partial refreshes cannot grow the retained store beyond either bound

#### Scenario: Content missing after successful database recovery

- **WHEN** database recovery completes after restart but the requested digest's Markdown is missing
- **THEN** `/skilldocs/:sourceId/:digest` returns 404 for unrecovered content
- **AND** the entity remains valid; previously built documentation is available only if a successful TechDocs build already exists
- **AND** a first documentation request receives 404 until successful extraction and re-fetch restore the content

#### Scenario: Content storage bounded per source

- **WHEN** retained Markdown content for a source approaches its independent retained-Markdown byte or digest-count limit
- **THEN** the connector enforces the storage bound without discarding content for active entities
- **AND** only unreferenced digests released by the D8 acknowledgment protocol are eligible for cleanup

#### Scenario: Extraction and retention settings are independent

- **WHEN** either `maxAggregateContentSizeBytes` or `maxRetainedMarkdownSizeBytes` is changed
- **THEN** only its extraction or durable Markdown pool's limit changes
- **AND** omitting the retention setting always selects 50 MiB, regardless of the extraction setting
- **AND** invalid retention values or startup limits below retained bytes are rejected without deleting content

#### Scenario: Controlled recovery from the retained-digest ceiling

- **WHEN** 1,000 retained unique digests prevent new admissions
- **THEN** raising the retained-byte budget does not increase that fixed count ceiling
- **AND** an operator can temporarily narrow the source's tagged inventory to retained content, or use D5's raw-only digest input to obtain a complete empty ready snapshot, under the same source ID
- **AND** excluded catalog entities are deliberately removed or updated, catalog processing is confirmed, and the provider acknowledges before any old content is released
- **AND** discovery is restored only after cleanup, within both retention bounds
- **AND** retention database reset and source disablement are not cleanup mechanisms

### Requirement: Authorized documentation retention acknowledgment

OCI sources SHALL expose `X-Skilldocs-Revision` on normalized
snapshot responses and authenticated `POST /skilldocs/:sourceId/reconcile`,
following D8's revision, authorization, validation, serialization, and durable
retention rules. Unlike the Markdown GET endpoint, the retention POST SHALL
require the configured provider service principal; authenticated users and other
service principals SHALL NOT modify retention state. The revision SHALL remain
outside the v1 JSON envelope. The
connector SHALL use its own database service for content and retention state.
This demo SHALL run one connector backend instance and one active provider runner
per source; source snapshot and acknowledgment requests SHALL reach that same
connector instance, as required by D8. Replica coordination is outside this increment.

#### Scenario: Documentation-safe source identifiers

- **WHEN** a source ID is blank or exactly `.` or `..`
- **THEN** startup configuration validation rejects it before constructing any snapshot or documentation URL
- **AND** valid IDs use individually encoded path segments without repeated decoding

#### Scenario: Completed observations expose revisions without authorizing release

- **WHEN** a source publishes a completed ready, partial, or failed snapshot
- **THEN** its response includes a newly allocated durable X-Skilldocs-Revision header
- **AND** only the current ready revision can authorize a new cleanup acknowledgment

#### Scenario: Authorized current-ready acknowledgment

- **WHEN** the configured `catalogProviderPluginId` service principal sends a valid `{ revision, retainedDigests }` body for the current ready snapshot
- **THEN** the connector atomically persists the retain set and cleanup eligibility before returning 204
- **AND** current snapshot content and acknowledged retained digests remain protected

#### Scenario: Unauthorized or malformed acknowledgment

- **WHEN** an authenticated caller is not the configured catalog provider service principal
- **THEN** the connector returns 403 without changing retention state
- **WHEN** an authorized caller sends an invalid revision/digest set, more than 1,000 digests, or an oversized body
- **THEN** invalid bodies return 400 and bodies larger than 5 MiB return 413 before parsing, without changing retention state
- **AND** unknown sources return 404 and unauthenticated calls fail backend authentication

#### Scenario: Superseded and repeated acknowledgments

- **WHEN** a previously unacknowledged revision is no longer current or the current snapshot is not ready
- **THEN** the connector returns 409 without deletion
- **WHEN** the same successful revision and identical retain set are retried
- **THEN** the connector returns 204 without further deletion, including after restart
- **AND** a conflicting set for that acknowledged revision returns 409

#### Scenario: Publication races cleanup

- **WHEN** a new snapshot reuses retained content while cleanup is requested
- **THEN** per-source serialization and a final current-reference check prevent deletion of newly published content

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
preserving their separate retry units (one page, one tag-to-digest
resolution, and one image acquisition/extraction using the pinned digest).

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
