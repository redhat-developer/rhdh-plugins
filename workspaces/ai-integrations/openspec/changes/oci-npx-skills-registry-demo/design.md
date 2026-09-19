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
and normalized snapshots. They do not construct catalog entities. The `skills-common` library
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
| Stable identity          | Registry host and repository, excluding tag/digest                        | Discovery entry `name` within the configured index       | `key`                               | D5 deterministic `metadata.name`                                   |
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

OCI keys use `<registry>/<repository>` with a lowercase registry host and the
registry's repository path. The OCI connector discovers repositories in a configured public Quay organization
using pagination and selects a configured tag (`latest` by default). It resolves
the tag once, fetches the manifest by SHA-256 digest, verifies the manifest bytes,
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
repository key for known failed candidates. It does not execute skill content.

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
Names, versions, tags, and content digests do not affect entity identity. A source
ID or native key change creates a different identity; no cross-source deduplication
is implied. Duplicate `(connectorPluginId, sourceId)` consumers or duplicate
`(source.type, source.id)` assignments are configuration errors.

The provider removes at most one leading `v`, validates the resulting declared
version as SemVer, and otherwise emits
`0.0.0+<first-12-hex-digits-of-record.digest>`. Display names go in
`metadata.title`, not `metadata.name`.

- OCI: `sourceUri` is `oci://<registry>/<repository>@sha256:<hex>` and must agree
  with `digest`. Set `backstage.io/source-location` to `url:<sourceUri>` and
  `rhdh.io/oci-skill-ref` to `sourceUri`.
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

### D6 — Snapshot completeness and durable reconciliation

Connectors refresh at startup and on a configurable Backstage scheduler task
(default ten minutes). Catalog provider instances poll on their own configurable
Backstage schedules (also ten minutes by default); GET requests do not trigger
registry retrieval. Source refreshes and per-source catalog runs do not overlap.

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
commit its state before consuming a newer connector snapshot. This closes the
crash window between catalog mutation and ownership persistence, including when
the connector has already removed a newly added skill from its next snapshot.

### D7 — Public-source safety, bounds, and configuration

v1 supports publicly readable registries only. Registry URLs and redirects must
use HTTPS, stay within explicitly configured origins (npx defaults to its index
origin), and reject credentials and private/loopback/link-local destinations,
including redirected destinations. Internal connector calls use Backstage
discovery/auth and are separate from these upstream egress restrictions.

Bound streaming reads, parsing, and concurrency: 30-second request timeouts,
at most four concurrent artifact operations per source, five redirects, 1 MiB
per npx skill artifact, 5 MiB per OCI compressed blob and decompressed layer,
200 inspected tar entries per layer, and 50 MiB total downloaded/decompressed
content per OCI image. Archive paths, symlinks, and devices must not escape
extraction storage; do not execute or materialize unnecessary entries. Enforce
D2 snapshot limits during discovery/normalization and bound discovery documents
and manifests to 5 MiB per response. A reached bound is an incomplete result,
not evidence of absence. Logs include source/key context and counters without
raw skill bodies, credentials, or tokens.

Each refresh also has a five-minute total deadline, at most 100 discovery pages,
and at most 1,000 inspected candidates (including skipped and failed candidates).
Detect repeated pagination tokens/URLs and stop instead of following a cycle.
Budget exhaustion or a pagination cycle publishes a bounded `partial` snapshot;
these limits bound work even when a source contains many non-skills.

Source configuration owns stable source ID, public registry/index location,
OCI selected tag, allowed origins, and refresh schedule. Catalog configuration
owns `connectorPluginId`, `sourceId`, expected source type, catalog namespace,
`defaultOwner`, `defaultLifecycle`, and polling schedule. Source IDs are unique
within each source type; plugin IDs are transport addresses, not identity keys.
Declare backend-only configuration in `config.d.ts` when implementing.

## Risks and Verification

- The #4747 `/images` payload alone lacks this normalized contract and resolved
  digest for tag-configured images. Add `/skills/:sourceId` and scheduled Quay
  discovery there; keep `/images` compatible and test both routes.
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
