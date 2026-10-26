# Design: Skill Connectors and a Common Catalog Provider

## Context

PR #4747 supplies an OCI connector/router that returns extracted SkillCard YAML
and skill Markdown. The model catalog already separates connectors from entity
production. Skills will use that separation with a common metadata contract, so
new sources can be integrated without teaching the catalog provider their native
formats. OCI and npx are the initial sources; MLflow is a future consumer of the
contract, not an implemented connector in this change.

## Decisions

### D1 — Separate source connectors from catalog entity production

```text
Quay / skillimage -> OCI connector --+
                                   +-> common REST contract -> skills catalog provider -> AiResource
Agent Skills index -> npx connector-+
```

Connectors own discovery, retrieval, integrity checks, native metadata parsing,
and normalized snapshots. They do not construct catalog entities. The `ai-skills-common` library
owns schemas, validation, and pure mapping helpers; it owns no runtime scheduler,
storage, or catalog connection. One catalog provider implementation owns
`AiResource` construction, configured defaults, and catalog reconciliation, with
independent instances/state for each configured source.

This extends the model connector pattern and reuses the acquisition work in
[PR #4747](https://github.com/redhat-developer/rhdh-plugins/pull/4747). Sharing only
an entity-building SDK would leave acquisition coupled to catalog ingestion.

### D2 — Versioned normalized REST contract

Each connector exposes `GET /skills/:sourceId` relative to its Backstage plugin
base URL. The configured source ID is encoded as one path segment. The common
provider resolves the configured `connectorPluginId` through Backstage discovery
and obtains a service token whose `targetPluginId` is that receiving plugin ID.
The endpoint uses Backstage's default backend authentication; it is not public
merely because its upstream registries are public. Unknown sources return 404.

Raw Markdown is not included in normalized v1 records. Extracted skill Markdown
is served through a separate dedicated endpoint (D8) and consumed via
`backstage.io/techdocs-ref` annotations (D5, D8).

The v1 JSON contract is:

```typescript
type SkillRecord = {
  key: string; // Stable identity within this source; never a content digest
  name: string; // Published human-readable name
  description?: string;
  version?: string; // Declared version, before catalog SemVer fallback
  license?: string;
  authors?: Array<{ name: string; email?: string }>;
  tags?: string[];
  compatibility?: string;
  owner?: string; // Optional catalog owner hint
  lifecycle?: string; // Optional catalog lifecycle hint
  sourceUri: string; // Digest-addressed OCI URI or fragment-free HTTPS URL
  digest: string; // sha256:<64 lowercase hex digits>
};

type OciSkillRecord = SkillRecord & {
  extensions?: { oci?: { namespace?: string; prompt?: string } };
};

type NpxSkillRecord = SkillRecord & {
  extensions?: { npx?: { type?: 'skill-md' } };
};

type SkillSnapshot = {
  schemaVersion: '1';
  source: { id: string; type: 'oci' | 'npx' };
  status: 'loading' | 'ready' | 'partial' | 'failed';
  observedAt: string | null; // UTC completion time; null before first attempt
  skills: Array<OciSkillRecord | NpxSkillRecord>;
  failedSkillKeys: string[];
};
```

`key`, `name`, source fields, `sourceUri`, and `digest` are non-empty and validated.
Optional fields are omitted when absent; a registry need not supply the whole
metadata superset. Snapshot validation discriminates records by `source.type`:
OCI snapshots accept only `OciSkillRecord`, npx snapshots accept only
`NpxSkillRecord`, and additional extension containers or keys are rejected.
Source-specific extensions preserve only explicitly mapped metadata, not
arbitrary source objects, credentials, local file paths, or raw YAML/Markdown.
The common provider never parses native files. The existing `/images` route
from #4747 can continue serving raw content separately.

One response contains one bounded snapshot, with at most 1,000 records and 5 MiB
of serialized JSON. A limit reached during discovery yields `partial`; no
response may silently truncate data and claim `ready`. Before applying count or
serialized-size limits, connectors sort successfully normalized records by
stable `key` in ascending Unicode code-point order and include the longest
prefix that fits; failed keys use the same ordering. This selection is
independent of pagination and concurrent completion order. The consumer bounds
its response read and rejects an oversized, malformed, unsupported-version, or
source-mismatched snapshot without changing that source's catalog state.

### D3 — Metadata superset, native mappings, and precedence

The table defines the v1 mapping. In the OCI column, `metadata.*` refers to the
SkillCard (`skill.yaml` or `skillimage.yaml`); frontmatter refers to `SKILL.md` or
`SKILLS.md`. In the npx column, frontmatter is from the verified `skill-md` file.
Select the first non-empty, correctly typed value in each ordered mapping.

| Concept                  | OCI native fields                                                         | npx native fields                                        | Normalized field                    | Catalog mapping                                                    |
| ------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------ |
| Stable identity          | Registry host, repository, and exact tag, excluding digest                | Discovery entry `name` within the configured index       | `key`                               | D5 deterministic `metadata.name`                                   |
| Display name             | `metadata.display-name`, `metadata.name`, frontmatter `name`              | Frontmatter `name`, discovery entry `name`               | `name`                              | `metadata.title`                                                   |
| Description              | `metadata.description`, frontmatter `description`                         | Frontmatter `description`, discovery entry `description` | `description`                       | `metadata.description`                                             |
| Version                  | `metadata.version`, frontmatter `metadata.version`, frontmatter `version` | Frontmatter `metadata.version`, frontmatter `version`    | `version`                           | `rhdh.io/ai-asset-version` using D5                                |
| License                  | `metadata.license`, frontmatter `license`                                 | Frontmatter `license`                                    | `license`                           | Retained in connector response; no new entity field                |
| Authors                  | `metadata.authors`, frontmatter `metadata.author`                         | Frontmatter `metadata.author`                            | `authors`                           | Retained in connector response; not inferred ownership             |
| Tags                     | `metadata.tags`, frontmatter `metadata.tags`                              | Frontmatter `metadata.tags`                              | `tags`                              | Catalog-valid values in `metadata.tags`                            |
| Compatibility            | `metadata.compatibility`, frontmatter `compatibility`                     | Frontmatter `compatibility`                              | `compatibility`                     | Retained in connector response                                     |
| Owner/lifecycle hints    | Frontmatter `metadata.owner` / `metadata.lifecycle`                       | Frontmatter `metadata.owner` / `metadata.lifecycle`      | `owner`, `lifecycle`                | Valid hints or configured `spec.owner` / `spec.lifecycle` defaults |
| Location and integrity   | Resolved manifest URI and verified manifest digest                        | Discovery entry `url` and verified entry `digest`        | `sourceUri`, `digest`               | D5 source-location and integrity annotations                       |
| Source-specific metadata | `metadata.namespace`, `spec.prompt`                                       | Discovery entry `type`                                   | `extensions.oci` / `extensions.npx` | Retained in response; no automatic entity projection               |

Trim scalar strings; normalize an author string to `[{ name: value }]`; accept
SkillCard authors with a non-empty `name` and optional `email`. Tags are arrays
of strings. Unsupported or incorrectly typed optional values are omitted with a
diagnostic. For catalog use, trim and lowercase tags, deduplicate them, and include
only values accepted by Backstage's existing catalog tag validator. Omit invalid
or overlength values with a diagnostic; do not truncate tags or synthesize new
ones by replacing characters. Authors never imply catalog ownership. SkillCard namespaces never override
the configured catalog namespace. Raw declared versions are retained in the
response; an invalid first-choice version uses D5's fallback, rather than
silently selecting a conflicting lower-priority value.

Example: SkillCard version `1.0.0` wins over frontmatter `metadata.version: "1.0"`.
OCI transport tags such as `1.0.0-draft` are not declared skill versions. Fields
not projected into `AiResource` remain available to other connector consumers.
The allowlisted extensions are `extensions.oci.namespace` from SkillCard
`metadata.namespace`, `extensions.oci.prompt` from `spec.prompt`, and
`extensions.npx.type` from discovery entry `type`. These are adapter mappings;
optional metadata conventions do not add requirements to the upstream formats.
Future MLflow mapping requires real source examples and contract tests; it is
not a prerequisite for these two connectors.

### D4 — Source acquisition and OCI extraction

OCI keys use `<registry>/<repository>:<tag>` with a lowercase registry host, the
registry's repository path, and the exact case-sensitive tag. The OCI connector
discovers repositories in a configured public Quay organization using pagination.
An omitted or blank `quayDiscovery.tag` selects all currently active tags in each
repository. Enumerate the paginated Quay tag-list API with `onlyActiveTags=true`;
expired tag history and untagged manifests are not candidates. A supplied tag is
an exact OCI tag filter, including an explicit `latest`; wildcard and regex
syntax are not supported. Exact-tag discovery retains its direct manifest-fetch
path without enumerating tags. Explicit `images[].imageRef` parsing is unchanged.

Each distinct repository/tag reference is a candidate. Deduplicate repeated
references from listing pages and explicit configuration, never by manifest
digest: two tags pointing at identical skill content produce two records and two
catalog entities. A tag moving to a new manifest updates the same stable key.
The connector resolves each selected tag once, fetches the manifest by SHA-256 digest, verifies the manifest bytes,
and verifies each downloaded blob against its descriptor before parsing it.
Records expose the same manifest digest and digest-addressed `sourceUri`.

Extend #4747's extraction for annotated file layers and tar/tar+gzip layouts
containing exactly one SkillCard and one skill Markdown document across the
supported layers. Multiple matching files, including duplicate archive entries
or conflicting annotated/archive layouts, are an ambiguous candidate: reject
the candidate and report its key in a `partial` snapshot. Manifest annotations are discovery
hints, not a mandatory gate: a valid skillctl archive without those annotations
can still produce a record. An inspected image without both files is skipped
as a non-skill; fetch failures, malformed candidate metadata, and integrity or
limit failures make the snapshot incomplete. The connector reports the stable
repository/tag key for known failed candidates. Confirmed non-skills emit neither
a normalized record nor a catalog entity. It does not execute skill content.

This is an explicit revision of the earlier manifest-only design. Bounded
extraction happens in the connector. The common provider and the existing
`AiResourceExtensionsProcessor` continue to avoid OCI downloads; the foundation
change's format-only processor contract is therefore preserved.

The npx connector consumes Agent Skills v0.2 indexes, including RHESS, and
processes only `skill-md` entries. It skips declared archives with a diagnostic,
retrieves supported artifacts over HTTPS, verifies SHA-256 over the original
bytes before decoding, then normalizes frontmatter using D3. It neither invokes
`npx` nor clones Git repositories. Duplicate discovery entry names are errors,
not two records with the same key. URI/digest fields always come from verified
retrieval, never from user-supplied frontmatter.

### D5 — Common entity mapping, identity, and integrity references

Each accepted record produces one upstream-compatible `AiResource` with
`apiVersion: backstage.io/v1alpha1`, `spec.type: skill`, configured catalog
namespace, and D3 metadata. The catalog provider requires usable configured
`defaultOwner` and `defaultLifecycle` and applies them when hints are absent or
invalid. It sets `rhdh.io/ai-asset-category: skill` and
`rhdh.io/ai-asset-source: <source.type>/<source.id>`.

Identity is the tuple `[source.type, source.id, record.key]`. Compute SHA-256
over its compact JSON UTF-8 encoding and use `skill-` plus the first 56 lowercase
hex digits as `metadata.name`. Persist the tuple alongside the entity reference;
reject and diagnose a hash collision instead of overwriting a different tuple.
Display names, declared versions, catalog metadata tags, and content digests do
not affect entity identity. OCI transport tags are part of `record.key`: distinct
tags produce distinct entity names, including aliases of the same digest. The
tag is not used as a declared skill version. A source
ID or native key change creates a different identity; no cross-source deduplication
is implied. Duplicate `(connectorPluginId, sourceId)` consumers or duplicate
`(source.type, source.id)` assignments are configuration errors.

This revises the earlier repository-only OCI identity. Existing experimental
repository-only entries are removed only after a complete valid `ready` snapshot
under D6 while tagged identities are added; incomplete snapshots retain old
entries. No shared JSON field or source-reference URI shape changes: keys remain
strings, and two tagged records may share a digest-addressed `sourceUri`.

The provider removes at most one leading `v`, validates the resulting declared
version as SemVer, and otherwise emits
`0.0.0+<first-12-hex-digits-of-record.digest>`. Display names go in
`metadata.title`, not `metadata.name`.

- OCI: `sourceUri` is `oci://<registry>/<repository>@sha256:<hex>` and must agree
  with `digest`. Set `backstage.io/source-location` to `url:<sourceUri>` and
  `rhdh.io/oci-skill-ref` to `sourceUri`. Set `backstage.io/techdocs-ref` to
  `url:<discovered-connector-base>/skilldocs/<sourceId>/<digest>` where
  `<discovered-connector-base>` is resolved through Backstage discovery using the
  configured `connectorPluginId`, `<sourceId>` is the configured source ID, and
  `<digest>` is the verified manifest digest from the record (`sha256:<hex>`).
  The provider constructs the annotation from trusted configuration and the
  connector's discovery-resolved base URL; it does not download or extract skill
  content. Same-digest tag aliases share the same documentation URL because they
  share the same manifest digest. When a tag moves to a new manifest, the entity's
  `backstage.io/techdocs-ref` updates to reflect the new digest, matching the
  entity's updated integrity references. The annotation is OCI-only for this
  increment; npx skill entities do not receive a `backstage.io/techdocs-ref`.
- npx: `sourceUri` is the configured index entry's absolute HTTPS artifact URL,
  serialized with the URL API. URL credentials, fragments, query-string
  credentials, and signed access tokens are rejected before the value is
  persisted; non-sensitive query parameters retain their original order.
  Redirects do not replace this identity locator. Set
  `backstage.io/source-location` to `url:<sourceUri>` and
  `rhdh.io/npx-skill-ref` to `<sourceUri>#<digest>`. A parser splits at the single
  literal `#`; comparison uses the serialized URL and lowercase SHA-256 digest.
  This reference records verified content at that URL, not a guarantee that the
  server supports immutable retrieval. Consumers fetching it again must reverify.

Configured digest-only references retain raw acquisition without inventing a tag.
They are deliberately excluded from normalized `skills` and `failedSkillKeys`;
that exclusion alone does not make a snapshot incomplete. An otherwise complete
digest-only inventory may therefore publish an empty `ready` snapshot. Changing
previously tagged configuration to digest-only input can remove those tagged
records from the next complete inventory and permit downstream ready-result
removals. Operators requiring normalized catalog identity must retain tagged input.

### D6 — Snapshot completeness and durable reconciliation

Connectors refresh immediately at startup and every ten minutes by default,
using configurable Backstage scheduler tasks. Explicit schedule initial delays
and manual trigger mode override automatic startup behavior. Catalog provider
instances poll on their own configurable
Backstage schedules (also ten minutes by default); GET requests do not trigger
registry retrieval. Source refreshes and per-source catalog runs do not overlap.
The OCI implementation uses standard Backstage `schedule` configuration per
source (or in the legacy flat block), parsed with
`readSchedulerServiceTaskScheduleDefinitionFromConfig`. An omitted schedule uses
frequency ten minutes, initial delay zero, and timeout
`max(2 * sourceOperationDeadlineMs, 60000)` milliseconds (ten minutes with defaults).
A configured block requires `frequency` and `timeout`; durations accept ISO
strings or human-duration objects, and frequency also accepts cron or
`{ trigger: manual }`. Configured initial delays are honored. Manual schedules
run only on a scheduler trigger, not automatically at startup; until their first
completion the snapshot stays `loading`. Scope defaults to and is enforced as
`local`, matching the per-backend-instance snapshot cache; explicit `global`
scope is rejected. Each refresh
gets a new operation deadline and budgets. Completed snapshots remain readable
while a replacement is acquired; publication occurs once the replacement is built.
`observedAt` records UTC completion, not the start of discovery. The normalized
endpoint and raw `/images` readiness are independent: valid extracted raw content
can be available even when its metadata fails normalization. Each source owns
its retained raw extractions, including references also configured by another
source. Publication atomically rebuilds the legacy `/images` union from these
source-owned maps. Identical `imageRef` values are deduplicated; the first
configured source retaining a successful extraction supplies the content.
`failedImages` excludes any reference successfully retained by another source.
A source cleans up only its superseded files; shutdown cleans all retained
extractions, including duplicate references hidden from the union. Raw status
aggregates sources: `loading` while any first refresh is incomplete, then `ready`
when any raw content is retained; without content it is `failed` only when all
source raw acquisitions failed. With no sources it is empty `ready`.

Publish a completed snapshot atomically. During a refresh, serve the previous
completed snapshot until replacement; before the first completion return
`loading` with empty arrays and `observedAt: null`. Status has precise meaning:

| Status    | Meaning                                                                                   | Catalog action                                                            |
| --------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `loading` | First acquisition is in progress                                                          | Preserve all state                                                        |
| `ready`   | Discovery finished within limits; every supported candidate was processed; no failed keys | Upsert records and remove previously owned keys absent from this snapshot |
| `partial` | Discovery, retrieval, verification, parsing, or limits prevented a complete result        | Upsert valid records; perform no removals                                 |
| `failed`  | No usable discovery result could be obtained                                              | Preserve all state                                                        |

`partial` may have no successful records or no known failed keys (for example,
a later listing page failed). `failed` contains no records; failed keys may be
unknown. `failedSkillKeys` and successful record keys are disjoint. A `ready`
snapshot has an empty failure list and can legitimately have zero records after
successful discovery. Known per-skill failures are represented by stable keys.
Deliberately unsupported entries and confirmed non-skills do not make discovery
incomplete. Malformed supported entries do.

The catalog provider persists last-known-good entities, their source tuples,
digests, and last-applied observation time using Backstage's database service.
Its location keys and mutations are scoped per source. Use delta mutations to
upsert accepted records and remove only after a valid `ready` snapshot. Connector
HTTP/auth errors, invalid envelopes, and consumer-side validation failures cause
no mutations for that source; other sources still reconcile. On restart, recover
durable state before reconciling. Ignore observations older than the persisted
one and make repeats idempotent. Before applying a catalog delta, transactionally
persist a pending record containing that exact delta and its intended next
ownership state/observation time. This is separate from committed reconciliation
progress. After the catalog mutation succeeds, atomically commit the next state
and clear the pending record. On restart or retry, replay any pending delta and
commit its state before consuming a newer connector snapshot. If replay or its
ownership commit fails, preserve the exact pending work and skip polling that
source until recovery succeeds; independent sources may continue. This closes the
crash window between catalog mutation and ownership persistence, including when
the connector has already removed a newly added skill from its next snapshot.

Provider removals persist the full original catalog entity reference, including
namespace, rather than reconstructing it from current configuration. A namespace
configuration change is reconciled even for a repeated connector observation:
ready results add the new identity and remove the old one; partial results retain
old identities until ready cleanup is authorized. Pre-upgrade pending removals
recover their original references from committed ownership; missing or ambiguous
ownership blocks that source's replay rather than guessing a namespace.

The provider database uses packaged Knex migrations with independent
`skills_catalog_provider_migrations` tracking and locking in the shared Catalog
database. The initial migration adopts compatible pre-existing development tables
without deleting their rows; incompatible missing-column schemas fail initialization.

The OCI connector retains extracted Markdown content for skills that have
last-known-good entities. Content retention follows the same lifecycle as
snapshot completeness: a `partial` refresh does not discard content for retained
entities, and content is recovered from durable storage after restarts. See D8
for the dedicated Markdown endpoint and content lifecycle.

> **Tasks 4.1/4.2 simplification:** Task 4.1 (PR #5291) introduced the
> initial provider implementation with independently configured source
> instances, Backstage discovery, service tokens, and substantial entity
> construction including OCI/npx mapping, separate tag aliases, and stable
> identities. PR #5304 completed the remaining task 4.2 scope: upfront
> source-reference validation rejecting invalid snapshots without additions,
> updates, or removals; nonblank invalid owner/lifecycle hint defaulting to
> configured values; consumer regression tests; and updated spec scenarios.
> The snapshot-validation and entity-construction scope of 4.2 is complete.
> The provider now uses `type: 'delta'` mutations scoped per source with
> durable database persistence (tasks 4.3–4.4, PR #5319).
> `DatabaseReconciliationStore` persists per-source committed ownership
> state and crash-safe pending deltas using provider-scoped composite keys.
> `loading` and `failed` statuses skip mutation (preserving previously
> committed entities); `partial` snapshots apply upserts only with no
> removals, retaining absent entities. Consumer validation failures
> (source-reference construction errors, malformed snapshots) reject the
> invalid source snapshot and preserve existing entities without additions,
> updates, or removals. Task 4.2's completion covers its snapshot-validation
> and entity-construction scope (#5291, #5304). Task 4.5 (comprehensive
> integration tests) now has file-backed SQLite restart, rollback, replay, and
> tag-identity coverage in PR #5319; maintainer basic regression verification passed.
>
> **Task 4.4 partial completion (PR #5315):** The pure decision portion of
> delta reconciliation is implemented as `calculateReconciliationPlan`, a
> standalone function that computes deterministic upsert/removal deltas
> from committed ownership state and a validated snapshot. Covers
> ready/partial/loading/failed status handling, stale/repeated observation
> detection, and cross-source identity collision diagnosis. PR #5319
> integrates that planner with durable persistence and replay, blocks newer
> observations for sources whose recovery fails, and adds database-backed
> verification. Task 4.5 is marked implemented following automated and maintainer basic regression verification.

### D7 — Public-source safety, bounds, and configuration

v1 supports publicly readable registries only. Registry URLs and redirects must
use HTTPS and stay within the source's configured destination policy. OCI source
registry trust includes its hostname and subdomains on the same HTTPS port;
additional unrelated origins require explicit configuration. npx defaults to its
index origin. Requests reject embedded credentials and private/loopback/link-local destinations,
including redirected destinations. Internal connector calls use Backstage
discovery/auth and are separate from these upstream egress restrictions.
Destination validation must govern the address used by the connection, including
after redirects. A preflight DNS lookup followed by an independent fetch lookup
does not satisfy this requirement. Task 2.4 must close this DNS-rebinding gap and
test address changes between validation and connection.

Bound streaming reads, parsing, and concurrency: 30-second request timeouts,
at most four concurrent artifact operations per source, five redirects, 1 MiB
per npx skill artifact, 5 MiB per OCI compressed blob and decompressed layer,
200 inspected tar entries per layer, and 50 MiB total downloaded/decompressed
content per OCI image. Archive paths, symlinks, and devices must not escape
extraction storage; do not execute or materialize unnecessary entries. Enforce
D2 snapshot limits during discovery/normalization and bound discovery documents
and manifests to 5 MiB per response. A reached bound is an incomplete result,
not evidence of absence. Logs include source/key context and counters without
raw skill bodies, credentials, or tokens. The D8 Markdown endpoint enforces
bounded content storage per source under its independent D8 retention budget; the
per-image decompressed-layer limit (5 MiB) bounds individual Markdown documents.

Decompression enforces `maxBlobSizeBytes` as an output ceiling while inflating
compressed layers, rather than checking only the final buffer size. Its default
is 5 MiB (5,242,880 bytes). These bounds apply before inspection can establish
whether an ordinary container image is a non-skill. A layer exceeding the ceiling
is a candidate acquisition failure, not confirmed absence of skill files. Reject
that candidate and continue independent candidates unless a shared source bound
or cancellation stops the operation. The raw `/images` endpoint lists that image
in `failedImages`; normalized partial snapshots represent known failed keys. Do not require a particular Node/zlib error message as the API contract.

The task 2.1 `/images` acquisition path shares HTTP utilities between OCI fetching
and Quay discovery and shares retry orchestration with image processing. Its
backend-only `skillImageConnector` configuration accepts optional `fetchTimeoutMs`
(default 30,000), `maxBlobSizeBytes` (5 MiB),
`maxAggregateContentSizeBytes` (50 MiB), `maxDiscoveryResponseSizeBytes` (5 MiB),
`maxImages` (25), `maxRetries` (2), `retryBaseDelayMs` (2,000),
`maxImageWorkBudgetBytes` (50 MiB downloaded/decompressed per image), and
`sourceOperationDeadlineMs` (300,000 ms for discovery, acquisition, extraction,
and retries across the source operation). Omission preserves defaults;
invalid values fail configuration validation, and zero retries disables retries.
The positive-integer `maxImages` limit applies to combined explicit images and
discovered repository/tag candidates attempted in each refresh. Each tag consumes a
slot, even if another tag has the same digest or extraction identifies a non-skill.
Explicit images take priority;
duplicate discovered references do not consume additional slots. An explicit
list exceeding the configured limit fails startup validation; excess discovered
candidates are skipped with a warning. Missing tags still consume candidate
slots. Raising this limit does not change the concurrency limit of four.
Each refresh discovery path uses one 100-page budget shared by repository and tag
listing requests, with bounded retries for each logical page. It deduplicates
repository listings, traverses repositories in Unicode code-point order, detects
repeated repository tokens and tag pages that make no progress, and sorts full
discovered references before applying the combined image cap. Exhausted budgets
and incomplete pagination are logged; the existing raw `/images` response has no
`partial` status. Structured discovery outcomes preserve candidates from completed
pages, indicate incompleteness, and distinguish a usable discovery result from
complete discovery failure. A later listing error, a malformed page, a cycle, or
budget exhaustion must not discard that prefix or publish `ready`. The normalized
result can be `partial` with no successful records; zero normalized successes alone
does not establish `failed`. Tag-list failures do not mean successful empty discovery.
Retained-content budget rejection always marks acquisition incomplete, including
bare-digest inputs without a tagged failure key. It releases the rejected files;
the deliberate raw-only exclusion policy applies only to otherwise successful
bare-digest extraction. Normalization handles every declared classification:
ambiguous candidates fail, confirmed non-skills are skipped, and an inconsistent
normalized result or unsupported outcome fails instead of silently contributing
to a complete snapshot. Skipped or rejected normalization results release their
extraction files without consuming retained-content budget.

These byte sizes are independent: the aggregate setting bounds retained decoded
skill content across accepted images, not D7's total downloaded/decompressed
budget per image. The task 2.1 defaults are acquisition defaults that operators
may override; D2 normalized-response limits remain unchanged.

Discovery retries one page with a new deadline per attempt. OCI authentication,
redirects, and body reading share one request deadline; for tag-based references, the image retry uses two independent scopes:
one for tag-to-digest resolution and one for acquisition/extraction using
the pinned digest; explicit digest references retain a single retry scope
wrapping the whole acquisition/extraction. Neither scope nests per-request
retries. Parent cancellation
stops work and backoff. Shared helpers enforce bounded streaming reads, clean up
unused responses, and classify transient errors by HTTP status or network causes.
Quay pagination and OCI authentication/extraction remain separate responsibilities.
Image-error reporting takes an internal `logNotFoundAsError` boolean: true logs
404s at error level for explicit image references, and false selects debug level
for discovered candidates. Explicit references take precedence during merging.
Other failures, including organization-listing 404s, retain diagnostics.
The `/images` failure list and status calculation are unchanged.
The current acquisition path implements the five-redirect cap, per-image work
budgets, and source-operation deadline. Initial registry, discovery, and token
requests and redirect targets use a per-request Undici dispatcher whose socket
lookup returns only the validated public address set. IPv6/IPv4 family selection
is enabled so an unreachable IPv6 address can fall back to validated IPv4 without
another DNS lookup. The original hostname remains
the TLS SNI and certificate-verification identity. All DNS answers are checked;
IPv4-mapped IPv6 addresses are normalized before classification. Non-public
addresses, including multicast and the full IPv6 link-local range, are rejected.
Dispatchers close gracefully after body consumption or cancellation and are
destroyed on request failure.

The configured initial registry/discovery origin is trusted after the plugin's
exact `allowedRegistries` source check. HTTPS redirects may stay on its original
hostname or use a subdomain of that hostname on the same port. This generic
registry-domain rule uses a dot boundary and is anchored to the initial source
throughout the redirect chain; it does not infer sibling domains, trust lookalike
suffixes, or use registry-specific CDN lists. DNS validation and connection pinning
still apply to every destination, and cross-origin redirects strip authorization.

Optional backend-only `sources[].allowedOrigins` (or flat
`skillImageConnector.allowedOrigins` for the legacy source) adds exact HTTPS
origins beyond that domain/port scope, such as an unrelated CDN. Omission permits
only the initial registry hostname and its subdomains on the same HTTPS port.
Configured origins cannot contain credentials, paths, queries, or fragments, and
trust in an explicitly configured external origin does not expand to its
subdomains.
Token realms retain the registry-host or explicitly configured
`credentials.tokenRealm` restriction, use the same pinned transport, and reject
all redirects. Task 2.4 acquisition safety is implemented. Task 2.5 adds normalized
snapshots and periodic refresh; catalog entity production remains section 4.
Task 2.5 is complete following maintainer testing and review, including verification of the standard Backstage scheduling configuration.

Each refresh also has a five-minute total deadline, at most 100 discovery pages
shared across repository and tag listings,
and at most 1,000 inspected candidates (including skipped and failed candidates).
Detect repeated pagination tokens/URLs and stop instead of following a cycle.
Budget exhaustion or a pagination cycle publishes a bounded `partial` snapshot;
these limits bound work even when a source contains many non-skills.

Source configuration owns stable source ID, public registry/index location,
OCI optional exact tag filter (all active tags by default), allowed origins, and
refresh schedule. Catalog configuration
owns `connectorPluginId`, `sourceId`, expected source type, catalog namespace,
`defaultOwner`, `defaultLifecycle`, and polling schedule. Source IDs are unique
within each source type; plugin IDs are transport addresses, not identity keys.
The OCI implementation declares backend-only `sources[]` entries with required,
unique nonblank `id`, `allowedRegistries`, optional validated `allowedOrigins`,
`images`, `quayDiscovery`, and optional standard Backstage `schedule`. The
unreleased `refreshIntervalMinutes` field is removed and rejected with a migration
error directing operators to `schedule.frequency` and `schedule.timeout`.
When the array is present these source fields do not inherit the corresponding
flat settings. Mixing explicit sources with flat `images`, `quayDiscovery`,
`allowedRegistries`, `allowedOrigins`, or `schedule` emits a warning naming only
the ignored field names, without their values; those settings remain ignored.
In particular, flat redirect origins never grant explicit sources
additional trust. Without the array, configured flat `images`/`quayDiscovery` maps
to source `default`, including the legacy flat origins and schedule.
Top-level numeric acquisition limits remain shared settings applied per source.
`GET /skills/:sourceId` requires normal backend authentication, returns 404 for an
unknown source, and treats its once-decoded route parameter as the source identity.
It does not re-decode percent sequences or perform upstream work.

### D8 — OCI skill TechDocs

OCI skill Markdown extracted during D4 acquisition is published as TechDocs
documentation for `AiResource` entities with `spec.type: skill`. This extends
the HTTP-based model-card TechDocs integration pattern established in the
`techdocs-modelcard-finalization` change: connector-owned Markdown endpoint,
discovery-resolved `backstage.io/techdocs-ref` annotation, and authenticated
URL-reader retrieval producing a minimal MkDocs project. No direct OCI
UrlReader is added; the existing URL reader retrieves extracted content over
connector HTTP; the connector alone acquires and extracts OCI artifacts. This
increment covers OCI skill documentation only; npx TechDocs is deferred.

**Connector Markdown endpoint.** The OCI connector exposes
`GET /skilldocs/:sourceId/:digest` relative to its Backstage plugin base URL.
The `sourceId` is the configured source identity (one path segment). The
`digest` is the verified manifest digest from the record
(`sha256:<64 lowercase hex digits>`). This provides unambiguous content
addressing: documentation matches the digest on the entity, even if its tag
subsequently moves to a new manifest. Same-digest tag aliases share the same
documentation content because they share the same manifest digest and therefore
the same URL. The endpoint uses Backstage's default backend authentication,
consistent with `/skills/:sourceId`; it is not public. Unknown source IDs or
unknown digests return 404. The endpoint returns the extracted Markdown with
`Content-Type: text/markdown` when available. It does not return successful
empty documentation on failure: if the Markdown is not available (extraction
failed, content was cleaned up, or the digest is unknown), it returns an
appropriate error status. The endpoint supports `ETag` response headers
derived from the manifest digest and `If-None-Match` conditional request
headers. A matching ETag returns 304 Not Modified. The digest is itself the
content identity; TechDocs caching uses this to avoid re-fetching and
re-building documentation for unchanged content.

**Content storage and lifecycle.** The connector uses its own Backstage database
service for durable Markdown keyed by source and verified manifest digest;
provider reconciliation state remains separately owned under D6. Store Markdown
before publishing a normalized record that refers to it. Recover stored content
and retention metadata before serving requests after restart. Database
initialization or recovery errors prevent connector startup. After successful
recovery, a request for missing content returns 404; it does not invalidate the
entity or promise a previous TechDocs build exists.

Retained Markdown bytes per source, including newly admitted content, are bounded
by optional backend-only `skillImageConnector.maxRetainedMarkdownSizeBytes`
(default 50 MiB = 52,428,800 bytes). This top-level positive safe integer applies
independently to each source's durable Markdown store. Omission uses the fixed
50 MiB default, not the configured extraction budget; invalid values fail
configuration validation. `maxAggregateContentSizeBytes` continues to govern
extracted content only. Changing either setting does not change the other.
A configured retention limit below already-retained bytes is rejected during
startup rather than evicting existing content. Declare the setting in the backend
config schema and reference documentation when implementing task 6.2.

Retain at most 1,000 unique digests per source, a fixed demo retention ceiling
aligned with D2's record cap and the acknowledgment body's digest-count bound.
Same-digest aliases share storage.
Existing retained content is never evicted to admit new content. If either bound
would be exceeded, exclude the new record, report its repository/tag key in
`failedSkillKeys`, and publish `partial`; existing records whose content is already
retained remain eligible. Failure to durably store new content has the same
publication behavior. Do not publish a record whose documentation is unavailable.
Repeated partial refreshes therefore cannot grow retained storage without bound.
Byte-budget exhaustion can be resolved by raising `maxRetainedMarkdownSizeBytes`
or by completing a reconciliation that releases unreferenced digests. Increasing
that byte budget cannot resolve the fixed 1,000-digest ceiling. For count exhaustion,
or when a turnover of content prevents a complete snapshot at the byte bound,
use a controlled inventory drain under the same source ID:

1. Keep the connector, provider, and retention authorization enabled. Temporarily
   narrow the source inputs to tagged records whose Markdown is already retained
   and can be completely acquired. If no such tagged inventory can complete,
   temporarily use a valid explicit digest-only input with discovery disabled;
   D5 deliberately excludes digest-only inputs from normalized records, permitting
   a complete empty `ready` snapshot while preserving raw acquisition.
2. Wait for that `ready` snapshot to reconcile, affected catalog entities to update
   or disappear, and the provider's acknowledgment to authorize cleanup. The drain
   intentionally removes excluded catalog entities; it does not silently evict
   documentation from entities that still reference it.
3. Confirm unreferenced digests were released before restoring tagged discovery
   in batches that fit both the retained-byte budget and the 1,000-digest ceiling.
   More than 1,000 simultaneously referenced distinct digests is outside this demo.

Do not delete or reset retention state or disable the source as a shortcut:
source/provider outages preserve last-known-good entities and cannot authorize
cleanup. Recovery still requires D8's catalog-visibility and acknowledgment checks.

**Reconciliation acknowledgment.** For OCI sources, add an
`X-Skilldocs-Revision` response header to `/skills/:sourceId`, leaving the v1 JSON
contract unchanged. Its value is a per-source monotonically increasing decimal
revision (serialized as a string in HTTP and JSON), durably allocated on each
completed snapshot publication, never reused on restart. Initial loading may omit
the header because it has no completed observation to acknowledge. Publication
and acknowledgment/cleanup are serialized per source. This demo protocol requires
one connector backend instance for each configured source and one active provider
runner for that source. D6's local scheduling and in-memory snapshots do not
coordinate replicas. Snapshot GET and reconciliation POST must reach the same
connector instance; operators must not load-balance these sources across replicas.
Multi-instance operation requires a future coordinated snapshot/publication and
retention design, rather than relying on the durable counter alone.
Retain all admitted content until a successful acknowledgment permits release;
a connector `ready` result alone never permits cleanup.

The provider persists the revision alongside its pending delta. After applying a
valid `ready` delta, it atomically commits D6's next ownership state together with
a durable acknowledgment to send to `POST /skilldocs/:sourceId/reconcile` with JSON
`{ revision, retainedDigests }`. The set contains all unique manifest digests
referenced by the source's committed last-known-good entities. The configured
provider is the sole retention owner for that source. The connector requires
Backstage service authentication and authorizes only the source's backend-only
configured `catalogProviderPluginId` (the caller's registered plugin ID,
`catalog` for a catalog backend module), rejecting other principals with 403;
no public or user write access.
The provider targets `skill-image-connector` for its request token. Unknown source
IDs return 404; malformed bodies, invalid digests, or more than 1,000 digests
return 400; bodies larger than 5 MiB return 413 before parsing.

Only a revision matching the connector's current `ready` snapshot may authorize
cleanup. Return 409 without deletion for an unacknowledged superseded or non-ready
revision. A previously successful identical acknowledgment is handled first by
the idempotency rule below. A successful acknowledgment atomically persists its retain set and marks only
digests absent from both that set and the current snapshot eligible for cleanup,
then returns 204. Keep only the most recent successful acknowledgment; its
revision and canonical retain set suffice for retry idempotency. Repeating that
acknowledged revision and identical set is idempotent (204 without further deletion); conflicting sets for the same revision
return 409. Retention metadata and successful acknowledgments survive restarts.
Cleanup rechecks current references under the publication lock, so a later refresh
cannot race deletion of content it is reusing.
The connector implements the acknowledgment and exact eligible deletions in one
database transaction before updating its in-memory state. Failure or interruption
rolls back both writes; a retry can execute the same acknowledgment safely. After
restart, recover all remaining rows without deriving new deletion candidates from
a historical retain set. In particular, preserve newer unacknowledged content and
content protected by the snapshot at acknowledgment time. A configured database
initialization, migration, or recovery failure prevents plugin startup rather than
silently permitting volatile publication or resetting revision counters.

After a crash, recover/replay the pending catalog delta and commit ownership
before sending its acknowledgment. A successful provider mutation is only queued
input to asynchronous catalog processing. Before sending any release acknowledgment,
query the catalog until every affected entity exposes its committed expected
TechDocs URL and every removed entity is absent. Persist those expected entity
references and URLs with the pending acknowledgment. Poll using the provider's
Backstage catalog service credentials on its bounded scheduled runs; a processing
error, timeout, or unreadable catalog leaves the acknowledgment pending, preserves
old content, and retries on the next run. Do not treat mutation acceptance alone
as proof that processed entities have stopped referencing old digests. Retry a
pending acknowledgment, including this visibility check, before polling
new snapshots. On 409 discard only that superseded acknowledgment and poll again;
on transport/auth/server errors retain it for retry, without undoing the committed
catalog state. A provider outage or failed catalog mutation sends no acknowledgment
and cannot cause cleanup. Partial snapshots may upsert but never acknowledge
release. Duplicate provider assignments for a connector/source are rejected;
multiple independent retention owners for one source are outside this increment.

The provider requires a durable reconciliation store and a catalog client capable
of querying processed entity references; visibility verification cannot be bypassed.
Before applying a ready OCI delta, persist its full acknowledgment context with
that delta: revision, connector plugin ID, retained digests, expected processed
entity references/URLs, and removal references. Replay uses this immutable context,
not current source configuration. Recover pending deltas first, then retry their
acknowledgments. An unresolved visibility check blocks newer polling for that
source, just as a delivery error does, so a later snapshot cannot overwrite its
release obligations. Incomplete catalog responses do not prove removals.
Partial and stale observations never create release acknowledgments.

Snapshot acquisition gives discovery, authentication, and fetch/body consumption
separate 30-second deadlines. Catalog visibility verification has one shared
30-second deadline including authentication and catalog queries; acknowledgment
delivery has another shared 30-second deadline including discovery, authentication,
and POST. Individual steps within either phase do not reset that phase's deadline.
These operations honor scheduler cancellation. Authenticated provider HTTP requests
reject redirects.

Eligible ready OCI snapshots with revisions may create acknowledgments even when
entities are unchanged or observations repeat; the connector handles repetitions
idempotently. This steady-state traffic is intentional and requires no additional
last-acknowledged-revision persistence. Recovery blocks, stale observations, deferred
visibility, and failures can prevent new delivery. Reconciliation success describes
the committed catalog work, not completion of its asynchronous acknowledgment.
Deferral is persisted and logged separately. Delivery errors propagate to their
caller, which logs the failure once and preserves pending work/source blocking.
An additive pending-delta migration preserves existing state. Legacy pre-release
OCI deltas with a revision but no complete acknowledgment context remain pending
and block that source for operator investigation; recovery cannot safely infer
ready versus partial status. Older deltas without revisions can replay without
release. Existing entities missing or changing their TechDocs annotation receive
an upsert even when digest and observation timestamp are unchanged.

**Provider annotation.** The catalog provider constructs the
`backstage.io/techdocs-ref` annotation for OCI skill entities using
`url:<discovered-connector-base>/skilldocs/<sourceId>/<digest>` as specified
in D5. The `<discovered-connector-base>` is resolved through Backstage
discovery using the configured `connectorPluginId`. The provider does not
download or extract skill content; it constructs the annotation from trusted
configuration and the record's verified digest. The annotation is set alongside
the existing identity, integrity, and source-location annotations. When a tag
moves to a new manifest, the entity's `backstage.io/techdocs-ref` updates to
reflect the new digest, consistent with D5's integrity reference update. npx
skill entities do not receive a `backstage.io/techdocs-ref` in this increment.

**URL-reader integration.** The existing `catalog-techdoc-url-reader-backend`
plugin is extended to match OCI skill documentation URLs from trusted
configured or Backstage-discovered connector destinations and paths. The reader
resolves configured OCI connector bases through Backstage discovery during service
initialization, before publishing its synchronous reader factory. Both predicate
selection and direct reads enforce those trusted destinations. The reader
matches the exact trusted connector origin and base pathname, followed by
`/skilldocs/<sourceId>/<digest>`. For example, a discovered base of
`https://rhdh.example/api/skill-image-connector` matches
`/api/skill-image-connector/skilldocs/...`, not a root-level `/skilldocs/` route.
Append to the base pathname rather than resolving a leading slash against the
origin. Source configuration rejects IDs exactly equal to `.` or `..` in
addition to blank IDs, because URL parsing normalizes literal and encoded dot
segments. Encode source ID and digest as individual path segments and decode each
once when validating the route; malformed encoding returns no match rather than
throwing from the predicate. Skill-documentation routes cannot fall through to
legacy model-card substring routing. Reject extra segments, query strings, fragments,
URL credentials, and paths outside the exact connector base. Do not forward
service tokens across redirects; treat redirects as errors. It does not infer
arbitrary credential destinations from URL substrings. The reader authenticates
using `auth.getPluginRequestToken` with `targetPluginId` set to the receiving
connector plugin's registered `pluginId`, consistent with the model-card URL
reader's service-token pattern. It propagates HTTP errors from the connector:
404 raises `NotFoundError`, 304 raises `NotModifiedError`, and other failures
propagate as errors. Successful responses produce a minimal MkDocs project
containing `mkdocs.yml` with a suitable skill title and `docs/index.md` with
the retrieved Markdown content. The reader passes the connector's `ETag`
response header through for TechDocs digest-based cache semantics. Conditional
OCI reads use explicit fetch revalidation cache mode so a matching ETag can
produce the connector's 304 response rather than being overridden by Node
fetch's automatic request cache-control policy. A successful
skill-docs response missing a nonblank ETag is a protocol error; no empty or
fabricated validator is substituted. Model-card HTTP requests also reject redirects,
while preserving their existing cache behavior. Already
validated Markdown frontmatter from the connector is included as-is in
`docs/index.md`; the reader does not strip or re-parse it. For this increment,
the reader renders the single extracted Markdown document only; bundled assets,
relative-file resolution, and multi-page documentation are out of scope.
The reader validates the manifest-digest route format and trusts the authenticated
connector to bind it to extracted bytes verified during acquisition. It does not
compare a Markdown hash to the manifest digest: these are different objects.
Existing model-card URL-reader behavior is preserved.

## Risks and Verification

- The raw `/images` payload and normalized `/skills/:sourceId` serve different
  contracts. Preserve raw compatibility and test independent readiness, authenticated
  normalized access, atomic publication, and scheduled refresh for both routes.
- Extraction adds network and archive-processing cost. Exercise digest failures,
  malformed archives, decompression limits, and traversal attempts with fixtures.
- Separate schedules permit eventual consistency. Test initial loading, refresh,
  partial failure, successful empty discovery, restart, stale observations, and
  catalog-mutation failure to prove that unavailable data does not cause deletion.
- Metadata differs across formats. Contract fixtures must cover both OCI layouts,
  npx frontmatter, conflicting versions, missing optional fields, extension
  preservation, and identical mapping behavior across connectors.
- Future sources may need additional fields. Version the shared schema and add
  explicit source mappings before integrating them; do not loosen validation
  based on hypothetical MLflow fields.
- OCI skill TechDocs introduces a content lifecycle dependency between the
  connector and the catalog provider. Test that retained content survives
  partial refreshes and restarts, that moved tags update the TechDocs
  annotation, that same-digest aliases share documentation, and that the
  URL reader correctly authenticates and propagates errors. Verify that model-card
  TechDocs integration remains functional after extending the URL reader.
