# skill-image-connector-backend

A Backstage backend plugin that fetches OCI skill images built via the [skillctl](https://github.com/redhat-et/skillimage) CLI, validates they conform to the skillimage format (requiring `skillimage.yaml` and `SKILLS.md` layers), and extracts those files to local storage.

## Installation

This plugin is installed via the `@red-hat-developer-hub/backstage-plugin-skill-image-connector-backend` package. To install it to your backend package, run the following command:

```bash
# From your root directory
yarn --cwd packages/backend add @red-hat-developer-hub/backstage-plugin-skill-image-connector-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-skill-image-connector-backend'
  ),
);
```

## Configuration

Add the following to your `app-config.yaml`:

```yaml
skillImageConnector:
  allowedRegistries:
    - quay.io
  # Optional acquisition tuning; shown values are the defaults.
  # fetchTimeoutMs: 30000
  # maxBlobSizeBytes: 5242880
  # maxAggregateContentSizeBytes: 52428800
  # maxImageWorkBudgetBytes: 52428800
  # maxDiscoveryResponseSizeBytes: 5242880
  # maxImages: 25
  # maxRetries: 2
  # retryBaseDelayMs: 2000
  # sourceOperationDeadlineMs: 300000
  # maxRetainedMarkdownSizeBytes: 52428800
  # catalogProviderPluginId: catalog
  # Option 1 and Option 2 can be used together or individually
  # Option 1: Explicit image references
  images:
    - imageRef: quay.io/gabemontero/hello-world-skill:1.0.0-draft
      # Optional; use environment variable substitution for secrets.
      # credentials:
      #   username: ${OCI_REGISTRY_USERNAME}
      #   password: ${OCI_REGISTRY_PASSWORD}
      #   # Required when the token service is on another host, including
      #   # anonymous token exchange.
      #   tokenRealm: https://auth.example.com/token
  # Option 2: Automatic public Quay organization discovery
  quayDiscovery:
    organization: my-skills-org # needed to enable discovery
    # registry: quay.io          # optional, defaults to quay.io
    # tag: latest                # optional exact filter; omit for all active tags
```

Both explicit images and Quay discovery can be used together. Discovered repository/tag references are merged with explicit images; duplicate full references are skipped. Duplicate comparisons ignore registry hostname casing while preserving repository paths, exact tag casing, and ports. The first explicit entry retains its original reference and credentials and takes priority over discovery. Different tags remain separate even when they point to the same manifest digest.

If `quayDiscovery` is present but `organization` is omitted or blank, the connector
logs a warning and skips discovery. Explicitly configured images still process.

Omitting `quayDiscovery.tag` now means **all active tags**, a change from the old
`latest` default. Set `tag: latest` explicitly to retain that behavior. Historical
expired tags and untagged manifests are not enumerated. Wildcards and regular
expressions are not supported. Null and blank strings are treated as omission; other
non-string values and invalid OCI tags fail startup validation. Explicit
`images[].imageRef` parsing is unchanged.

Repository and tag listing share the existing request timeout, retry, bounded
response reader, and a total 100-page budget. Traversal stops with diagnostics on
budget exhaustion or pagination without progress. A tag-list request failure is
reported as incomplete discovery, not as an empty repository. The raw `/images`
endpoint retains its response format; normalized snapshots preserve discovery
completeness as described below.

Only successfully extracted skill images appear in `/images`; a container
without the required skill files is not an accepted result. Different tags with
the same content still appear separately. The OpenSpec catalog design likewise
requires one entity per valid skill-image tag, keyed by
`<registry>/<repository>:<tag>`; this plugin does not create catalog entities.

### Source instances and refresh scheduling

Existing flat configuration maps to a single source named `default` when
`images` or `quayDiscovery` is configured. Its normalized endpoint is
`GET /api/skill-image-connector/skills/default`. With no configured sources,
`/images` is empty and `ready`; there is no implicit snapshot source.

Use `sources` for independent inventories:

```yaml
skillImageConnector:
  # Acquisition limits above remain top-level and apply to each source.
  sources:
    - id: public-skills
      allowedRegistries:
        - quay.io
      # Optional unrelated redirect origins, scoped only to this source:
      # allowedOrigins:
      #   - https://cdn.example.com
      schedule:
        frequency: { minutes: 10 }
        timeout: { minutes: 10 }
        initialDelay: { seconds: 0 }
        scope: local
      quayDiscovery:
        organization: my-skills-org
        # tag: latest # omit for all active tags
      images:
        - imageRef: quay.io/my-skills-org/example:v1
```

Each `sources[].id` is required, nonblank after trimming, and unique. The
values `'.'` and `'..'` are rejected at startup validation. It is a
stable identity, not an array position. URL-encode it once as a single path
segment when requesting its snapshot. Renaming an ID creates a different source
identity for consumers. Each source owns `images`, `quayDiscovery`,
`allowedRegistries`, `allowedOrigins`, and `schedule`. When
`sources` is present, the corresponding flat settings are ignored, including
flat `allowedOrigins` and the flat `schedule`. Mixing `sources` with flat
`images`, `quayDiscovery`, `allowedRegistries`, `allowedOrigins`, or `schedule`
emits a startup warning naming the ignored fields, without logging their values.
The flat values remain ignored. Origins are validated as
exact HTTPS origins without credentials, paths, queries, or fragments; one
source's redirect permissions never grant another source access. Global
`allowedOrigins` applies only to the legacy flat source. Numeric acquisition
limits such as `fetchTimeoutMs`, `maxImages`, and `sourceOperationDeadlineMs`
remain top-level settings shared by all sources.

The optional `schedule` block uses Backstage's standard schedule parser, as do
the model-catalog and MCP registry providers. Configure it per source or, for
legacy flat configuration, as `skillImageConnector.schedule`. If the entire block
is omitted, the source starts immediately (`initialDelay: { seconds: 0 }`) and
refreshes every ten minutes. Its default task timeout is
`max(2 * sourceOperationDeadlineMs, 60000)` milliseconds: ten minutes with the
default five-minute source deadline. The scheduler timeout and source-operation
deadline are separate bounds.

When providing `schedule`, specify both `frequency` and `timeout`. Duration values
accept ISO strings such as `PT10M` or human-duration objects such as
`{ minutes: 10 }`. `frequency` also accepts `{ cron: '0 * * * *' }` and
`{ trigger: manual }`. `initialDelay` is optional and is honored when supplied.
A manual schedule runs only when triggered through the Backstage scheduler; it
does not automatically acquire at startup, and its snapshot remains `loading`
until the first triggered refresh completes. A configured initial delay likewise
keeps the initial snapshot `loading` until that acquisition completes.

Scope is always `local`, matching the per-backend-instance snapshot cache. Omit
`scope` or set it to `local`; `scope: global` fails startup validation. A source's
refreshes do not overlap, while different sources refresh independently. Every
refresh receives a fresh source-operation deadline and work budgets. Shutdown
cancels active work. GET requests only read the cache and never contact a registry.
The previous completed snapshot remains available while its replacement is built.
The unreleased custom `refreshIntervalMinutes` option has been removed: supplying
it fails with a migration error. Replace it with, for example,
`schedule.frequency: { minutes: 10 }` and `schedule.timeout: { minutes: 10 }`.

Explicit digest-only references (`repo@sha256:...`) remain supported by `/images`.
They have no repository/tag identity, so they deliberately produce neither a
normalized record nor a normalized failed key. This exclusion alone does not
make a snapshot partial; an inventory containing only successful digest-only
references can have an empty `ready` normalized snapshot. Switching a previously
tagged configuration to digest-only references can therefore remove those tagged
records from the next complete snapshot; a downstream catalog consumer may
remove their previously owned entities. Use tagged inputs when normalized catalog
identity is required; their acquisition still uses a verified, pinned digest.

### Configuration fields

| Field                                                      | Type            | Description                                                                                                                                                                                                                                    |
| ---------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skillImageConnector.sources`                              | `array`         | Optional independent OCI sources. When present, overrides the corresponding flat source fields with a startup warning.                                                                                                                         |
| `skillImageConnector.sources[].id`                         | `string`        | Required stable, nonblank source ID, unique within this connector; used by GET /skills/:sourceId.                                                                                                                                              |
| `skillImageConnector.sources[].allowedRegistries`          | `array`         | Exact registry host and port allowlist; required when images or Quay discovery are configured.                                                                                                                                                 |
| `skillImageConnector.sources[].allowedOrigins`             | `array`         | Optional exact HTTPS redirect origins for this source only. Does not inherit flat allowedOrigins.                                                                                                                                              |
| `skillImageConnector.sources[].schedule`                   | `object`        | Optional standard Backstage schedule. Omission defaults to ten-minute frequency, immediate startup, and local scope; see scheduling guidance above.                                                                                            |
| `skillImageConnector.sources[].schedule.frequency`         | `string/object` | Required when schedule is supplied. Duration, cron object, or manual-trigger object parsed by Backstage.                                                                                                                                       |
| `skillImageConnector.sources[].schedule.timeout`           | `string/object` | Required when schedule is supplied. Backstage task timeout, separate from sourceOperationDeadlineMs.                                                                                                                                           |
| `skillImageConnector.sources[].schedule.initialDelay`      | `string/object` | Optional delay before the first invocation; defaults to zero. Manual schedules require an explicit scheduler trigger.                                                                                                                          |
| `skillImageConnector.sources[].schedule.scope`             | `string`        | Omit or set to local. Global scope is rejected because snapshots are cached per backend instance.                                                                                                                                              |
| `skillImageConnector.sources[].images`                     | `array`         | Optional explicit OCI image references; may be combined with this source’s Quay discovery.                                                                                                                                                     |
| `skillImageConnector.sources[].images[].imageRef`          | `string`        | Full OCI image reference, tagged or digest-addressed. Digest-only inputs remain raw-only.                                                                                                                                                      |
| `skillImageConnector.sources[].images[].credentials`       | `object`        | Optional username/password and explicit tokenRealm fields, as described for legacy images credentials below; scoped to this image.                                                                                                             |
| `skillImageConnector.sources[].quayDiscovery`              | `object`        | Optional public Quay organization discovery for this source.                                                                                                                                                                                   |
| `skillImageConnector.sources[].quayDiscovery.registry`     | `string`        | Quay registry host; defaults to quay.io. Must be in this source’s allowedRegistries.                                                                                                                                                           |
| `skillImageConnector.sources[].quayDiscovery.organization` | `string`        | Public organization to discover. Omission or a blank value skips discovery with a warning.                                                                                                                                                     |
| `skillImageConnector.sources[].quayDiscovery.tag`          | `string`        | Optional exact tag filter. Omit or leave blank for all active tags; set latest explicitly to select it.                                                                                                                                        |
| `skillImageConnector.images`                               | `array`         | Legacy; ignored when sources[] is configured. Explicit images for the default source.                                                                                                                                                          |
| `skillImageConnector.images[].imageRef`                    | `string`        | Legacy; ignored when sources[] is configured. Full OCI image reference (tagged or digest-addressed).                                                                                                                                           |
| `skillImageConnector.images[].credentials`                 | `object`        | Legacy; ignored when sources[] is configured. Optional image credentials or explicit registry token realm.                                                                                                                                     |
| `skillImageConnector.images[].credentials.username`        | `string`        | Legacy; ignored when sources[] is configured. Registry username; required together with password.                                                                                                                                              |
| `skillImageConnector.images[].credentials.password`        | `string`        | Legacy; ignored when sources[] is configured. Registry password; use environment variable substitution.                                                                                                                                        |
| `skillImageConnector.images[].credentials.tokenRealm`      | `string`        | Legacy; ignored when sources[] is configured. Optional HTTPS token endpoint without URL credentials; required for cross-host token exchange.                                                                                                   |
| `skillImageConnector.allowedRegistries`                    | `array`         | Legacy; ignored when sources[] is configured. Exact registry host and port allowlist for the default source.                                                                                                                                   |
| `skillImageConnector.allowedOrigins`                       | `array`         | Legacy; ignored when sources[] is configured. Optional exact HTTPS redirect origins for the default source. See [Security model](#security-model).                                                                                             |
| `skillImageConnector.quayDiscovery`                        | `object`        | Legacy; ignored when sources[] is configured. Optional public Quay discovery for the default source.                                                                                                                                           |
| `skillImageConnector.quayDiscovery.registry`               | `string`        | Legacy; ignored when sources[] is configured. Quay registry host; defaults to quay.io.                                                                                                                                                         |
| `skillImageConnector.quayDiscovery.organization`           | `string`        | Legacy; ignored when sources[] is configured. Public organization; omission or a blank value skips discovery with a warning.                                                                                                                   |
| `skillImageConnector.quayDiscovery.tag`                    | `string`        | Legacy; ignored when sources[] is configured. Optional exact tag filter; omit or leave blank for all active tags.                                                                                                                              |
| `skillImageConnector.schedule`                             | `object`        | Legacy; ignored when sources[] is configured. Optional standard Backstage schedule for the default source, with the same fields and defaults as sources[].schedule.                                                                            |
| `skillImageConnector.schedule.frequency`                   | `string/object` | Legacy; ignored when sources[] is configured. Required in a supplied schedule: duration, cron, or manual trigger.                                                                                                                              |
| `skillImageConnector.schedule.timeout`                     | `string/object` | Legacy; ignored when sources[] is configured. Required Backstage task timeout in a supplied schedule.                                                                                                                                          |
| `skillImageConnector.schedule.initialDelay`                | `string/object` | Legacy; ignored when sources[] is configured. Optional first-run delay; defaults to zero.                                                                                                                                                      |
| `skillImageConnector.schedule.scope`                       | `string`        | Legacy; ignored when sources[] is configured. Omit or set local; global scope is rejected.                                                                                                                                                     |
| `skillImageConnector.maxRetainedMarkdownSizeBytes`         | `number`        | Maximum retained Markdown bytes per source for durable storage. Positive safe integer; defaults to 52,428,800 (50 MiB). Independent of `maxAggregateContentSizeBytes`. A configured value below already-retained bytes is rejected at startup. |
| `skillImageConnector.catalogProviderPluginId`              | `string`        | Plugin ID of the authorized catalog provider for reconciliation. Omitted or blank values default to `'catalog'`; wrong types are rejected. Only this principal may call `POST /skilldocs/:sourceId/reconcile`.                                 |

By default, at most 25 image candidates are processed, including explicit images and discovered repository/tag candidates. Set `skillImageConnector.maxImages` to raise or lower this total (for example, `100` to attempt up to 100 distinct image references). A repository with many tags consumes multiple candidate slots; increasing this cap does not guarantee every tag fits. Explicit images take priority, and discovered references already present in the explicit list do not consume another slot. An explicit list exceeding the limit fails startup validation; excess discovered candidates are skipped with a warning. This bounds candidates attempted, not successful skill extractions: repositories without the selected tag still consume a slot. It does not change the concurrency limit of four image operations.

**Use immutable digest references (`@sha256:...`) in production.** Mutable tags can be moved or replaced by the registry; the plugin warns at startup when a tag reference is used. Digest-pinned references are verified against the manifest content, preventing tag mutation attacks.

By default, each downloaded blob and decompressed layer is limited to 5 MiB. Two independent byte budgets apply per source:

- **`maxAggregateContentSizeBytes`** (default 50 MiB): limits the combined retained `skillimage.yaml` and `SKILLS.md` content across accepted images within a single refresh cycle. This is an extraction-time budget that does not measure total downloads or peak process memory.
- **`maxRetainedMarkdownSizeBytes`** (default 50 MiB): limits the total durable Markdown bytes retained per source across refresh cycles for reconciliation and restart recovery. This budget is enforced independently during content admission and is persisted to the database when available.

These limits are independent: one controls extraction-time content, the other controls durable retention. Each has its own default, and configuring one does not affect the other. All configuration fields use `@visibility backend` or `@visibility secret` and are not exposed to the frontend.

### Optional acquisition limits

All of these backend-only settings are optional. Omitted settings use the shared defaults; supplied values are validated at startup. Backstage numeric environment substitutions are supported. Byte limits, delays, and `maxImages` must be positive safe integers; `maxRetries` must be a nonnegative safe integer. Timeout and base-delay values must not exceed 2,147,483,647 ms (Node's timer limit).

| Field under `skillImageConnector` | Default    | Scope                                                                                        |
| --------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `fetchTimeoutMs`                  | `30000`    | One discovery attempt or OCI request, including redirects, authentication, and body reading. |
| `maxBlobSizeBytes`                | `5242880`  | Both the compressed/downloaded blob and the decompressed layer, checked separately.          |
| `maxAggregateContentSizeBytes`    | `52428800` | Combined retained skill YAML and Markdown across accepted images.                            |
| `maxImageWorkBudgetBytes`         | `52428800` | Total downloaded and decompressed bytes per OCI image across all inspected layers.           |
| `maxDiscoveryResponseSizeBytes`   | `5242880`  | One discovery response, enforced during streaming even without Content-Length.               |
| `maxImages`                       | `25`       | Combined explicit images and discovered candidates attempted per source refresh.             |
| `maxRetries`                      | `2`        | Retries after the initial page or image acquisition attempt. Set `0` to disable.             |
| `retryBaseDelayMs`                | `2000`     | Initial backoff; doubled for each further retry and capped at Node's timer limit.            |
| `sourceOperationDeadlineMs`       | `300000`   | Total wall-clock deadline for processing all images from one source.                         |

The per-image work budget (`maxImageWorkBudgetBytes`) is distinct from the retained-content budget (`maxAggregateContentSizeBytes`). The work budget covers all downloaded compressed blobs and decompressed layer data inspected for a single image, including competing or irrelevant archive layers inspected for classification. The retained-content budget limits the combined decoded skill YAML and Markdown strings kept in memory across accepted images. Both are independently enforced.

Manifest responses retain their separate 5 MiB limit; token responses retain their 1 MiB limit. Repository and tag pagination (100 pages combined), redirects (five per D7), concurrent image operations (four), tar entries (200 per layer), and total candidates (1,000 including non-skills and failures) also have distinct shared defaults. For tag-based references, tag resolution and image acquisition/extraction each have independent retry scopes: transient failures during tag resolution are retried before the resolved digest is used for acquisition, and transient failures during acquisition are retried using the already-pinned digest. Explicit digest references use a single retry scope wrapping the whole acquisition/extraction. Individual OCI requests do not add another retry loop.

Discovery and OCI requests share HTTP redirect validation, response cleanup, and bounded body reading. Initial requests and redirects are validated: must use HTTPS, reject URL credentials, localhost and literal IPs, and resolve DNS to public addresses before connecting. Authorization headers are removed when following cross-origin redirects. DNS resolution is validated for both initial requests and every redirect target to prevent DNS rebinding attacks.

### Database / Durable storage

The plugin requires Backstage's database service for durable Markdown retention.
Extracted skill Markdown, revision counters, and the last successful
reconciliation acknowledgment are persisted in three tables
(`retained_markdown`, `source_revision`, `reconcile_state`). Use persistent
SQLite files or PostgreSQL to retain those rows across backend restarts;
SQLite `:memory:` storage does not survive a process restart.

Acknowledgment and its exact eligible content deletions commit in one database
transaction. A crash or failed deletion rolls back both, leaving the same
acknowledgment safe to retry. In-memory state changes only after the transaction
commits. Recovery preserves all remaining content, including newer unacknowledged
publications and content protected by the acknowledged snapshot; it never uses
an old retain set to infer permission for additional deletions.

Database initialization, migration, or recovery failures stop plugin startup.
There is no silent fallback to volatile publication. Content write failures
exclude affected new records and produce a partial snapshot; revision write
failures prevent publication. Failed acknowledgment/deletion transactions return
an error without committing retention changes. The standalone store supports an
explicit in-memory mode for unit tests; the plugin always supplies its database
service.

**Single-instance restriction:** Snapshot caches and in-memory content are
local to each backend instance. The scheduler scope is always `local`, and
there is no cross-instance synchronization. Running multiple backend instances
against the same database produces independent, potentially divergent snapshots.

**Controlled inventory drain:** When the byte budget or fixed 1,000-digest ceiling
prevents new admissions, keep the same source, provider, and retention
authorization enabled. Narrow source inputs to tagged skills whose Markdown is
already retained. If necessary, disable discovery and use a valid explicit
digest-only input to obtain an empty normalized ready snapshot (digest-only
inputs remain raw-only). Wait for ready reconciliation, confirm affected catalog
entities have updated or disappeared, and let the provider send its acknowledgment.
Only then can the connector release unreferenced content. Restore tagged discovery
in batches within both limits; do not manually shorten the retain set, reset the
retention database, or disable the source as a cleanup shortcut. Raising the byte
budget does not raise the fixed digest ceiling. A retention limit below stored
bytes is rejected at startup, so drain before lowering that limit.

## How it works

At startup the plugin clears stale extraction directories, reads source
configuration, initializes loading snapshots, and registers source scheduler
tasks. Each scheduled refresh (immediate at startup by default) then:

1. Reads the source's configured image references.
2. Starts a fresh source deadline and acquisition budgets.
3. If `quayDiscovery` is configured, discovers public repositories using paginated API calls. With no tag filter, it then lists active tags for each repository; an exact tag filter skips tag listing. Distinct references are sorted before merging with the explicit image list and applying `maxImages`.
4. For each tag-based image reference, resolves the mutable tag to a SHA-256 manifest digest using the Distribution Spec v2 HTTP API. All subsequent fetches (including retries) use the pinned digest, preventing a moved tag from redirecting to different content mid-acquisition. Explicit digest references skip this resolution step.
5. Fetches the OCI manifest from the registry using the pinned digest (or the original digest reference) and verifies its raw bytes before parsing or fetching layers.
6. Determines the extraction strategy:
   - **Annotated layers**: Two individual layers annotated with `org.opencontainers.image.title` set to `skillimage.yaml`/`skill.yaml` and `SKILLS.md`/`SKILL.md`.
   - **Tar archives**: One or more `tar` or `tar+gzip` layers (as produced by `skillctl`) containing the skill files as tar entries.
7. Downloads the layer blobs, verifies their SHA-256 or SHA-512 digests, extracts content (decompressing tar+gzip if needed), and writes files to a temporary directory.
8. Parses the SkillCard YAML and optional Markdown frontmatter, then calls the shared `normalizeOciMetadata()` adapter with the verified tagged identity, digest, and source URI. Malformed frontmatter produces normalization diagnostics even when the SkillCard has sufficient metadata.
9. Stores raw extraction results for `/api/skill-image-connector/images` and atomically publishes a bounded normalized snapshot at `/api/skill-image-connector/skills/:sourceId`. The raw endpoint's payload does not change.

Exactly one SkillCard and one Markdown document must occur across supported
layers. A pair split between annotated raw files and an archive is supported.
Duplicate files, including repeated archive entries or competing layouts, fail
with an ambiguity error. Annotated raw files are never parsed as tar archives,
even when their descriptor media type says tar. Manifest metadata annotations
are optional for valid skillctl archives.

Confirmed non-skill images are skipped with a debug message and do not enter
`failedImages`. Ambiguous candidates fail with an error message. Malformed native
metadata produces no normalized record and logs a warning; an otherwise successful
raw extraction remains available through `/images`. Bare digest references also
retain raw acquisition without inventing a tagged normalized identity.

Transient discovery and registry failures (network errors including wrapped fetch causes, HTTP 5xx, and request timeouts) are retried up to two times by default, with 2-second then 4-second backoff. Discovery retries one page with a fresh timeout each time; tag resolution and pinned acquisition/extraction have independent retry scopes. Successful tag resolution is never repeated within an acquisition. Validation failures, size violations, malformed JSON, and non-5xx HTTP failures are not retried. Shutdown cancels active requests and backoff promptly. OCI authentication challenges are handled separately within the same request deadline.

A discovered repository may not have an explicitly selected tag, and an enumerated tag can disappear before acquisition. HTTP 404 failures while
acquiring discovered images are logged only at debug level; explicitly configured
images retain their error diagnostics because their references are expected to
exist. When discovery finds an explicitly configured reference, the explicit
reporting policy wins. The internal `logNotFoundAsError` flag selects this behavior;
it is not an additional app-config setting. Other acquisition errors and a 404
from the Quay organization-listing endpoint are still reported. Missing images
remain in `failedImages`, and raw `/images` readiness remains independent of normalization success.

### Verified acquisition metadata

Successful tagged acquisitions retain typed internal `acquisition` metadata:

```json
{
  "key": "quay.io/org/skill:V1",
  "digest": "sha256:<64 lowercase hex digits>",
  "sourceUri": "oci://quay.io/org/skill@sha256:<same hex digits>"
}
```

The key uses a lowercase registry host and the exact tag. Aliases of the same
digest retain distinct keys and share a source URI. A subsequent acquisition
after tag movement keeps the key and updates the digest and source URI. The
shared `ai-skills-common` validator and reference builder govern these fields.
Explicit digest references retain raw acquisition without inventing a tagged
identity. This metadata is internal; the existing `/images` payload is unchanged.
Normalization uses the shared `ai-skills-common` mappings. Tagged results are
published in authenticated, source-scoped snapshots; `/images` retains the raw
extracted content independently of normalization success.

To reproduce the pinning and integrity checks without a live registry, run from
`plugins/skill-image-connector-backend`:

```sh
yarn test --watchAll=false --runInBand src/plugin.pinning.test.ts src/plugin.integration.test.ts src/services/OciClient.test.ts src/services/SkillImageService.test.ts src/plugin.normalization.test.ts src/services/normalizeExtraction.test.ts
```

The deterministic registry fixtures exercise the actual plugin, OCI client, and
extraction service, including tag movement, a transient blob failure after
resolution, resolution retries, manifest mismatches before layer fetching, blob
size/digest mismatches, alias identities, and explicitly digest-addressed images.

## API

### `GET /api/skill-image-connector/health`

Returns `{ "status": "ok" }` when the plugin is running.

### `GET /api/skill-image-connector/images`

Returns raw extracted content and aggregate processing status across all sources.
Status is `loading` while any source has not completed its first refresh. Once
all sources have completed, available raw extractions make it `ready` even if
metadata cannot be normalized; raw and normalized statuses are independent.
With no raw extractions it is `failed` only when every source's raw acquisition
has failed, otherwise `ready`. No configured sources yields empty `ready`.
Local filesystem paths are intentionally not returned.

Each source owns its retained extractions independently, even when multiple
sources configure the same `imageRef`. Each completed source refresh atomically
rebuilds the aggregate inventory from retained source results. Duplicate references
appear once; the first configured source with a successful extraction supplies
the raw content. A reference appears in `failedImages` only if it failed and no
source retains a successful extraction for it. Refreshing one source neither
deletes another source's files nor removes its successful inventory entry.
Shutdown cleans all retained source extractions, including duplicate references
hidden by aggregation.

Example response:

```json
{
  "status": "ready",
  "failedImages": [],
  "images": [
    {
      "imageRef": "quay.io/gabemontero/hello-world-skill:1.0.0-draft",
      "skillImageYaml": "name: hello-world-skill\nversion: 1.0.0\n",
      "skillsMd": "# Hello World Skill\n"
    }
  ]
}
```

### `GET /api/skill-image-connector/skills/:sourceId`

Returns the cached v1 `SkillSnapshot` for one configured OCI source. Backstage's
default backend authentication applies; this endpoint is not public even when
upstream registries are public. A service caller obtains a token targeting the
receiving plugin ID `skill-image-connector`. Unknown source IDs return HTTP 404.
Source IDs are decoded once by routing; clients must URL-encode the path segment.

An unknown source returns HTTP 404 with a JSON object containing an `error` string:

```json
{ "error": "Unknown source: unknown-source" }
```

Use the HTTP status and `error` field to handle the response. The string is a
human-readable diagnostic; its exact wording and inclusion of the ID are not a
stable machine-readable contract.

Before the first refresh completes:

```json
{
  "schemaVersion": "1",
  "source": { "id": "default", "type": "oci" },
  "status": "loading",
  "observedAt": null,
  "skills": [],
  "failedSkillKeys": []
}
```

Completed snapshots have a UTC completion timestamp in `observedAt` and one of:

| Status    | Meaning                                                                                                                                  |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ready`   | Discovery and supported candidate processing completed within limits. Empty results are valid and `failedSkillKeys` is empty.            |
| `partial` | Discovery, acquisition, integrity, metadata, or bounds prevented a complete result. It may contain zero records or no known failed keys. |
| `failed`  | No usable discovery result was obtained. No normalized records are published.                                                            |

Known candidate failures use stable `<registry>/<repository>:<tag>` keys, disjoint
from successful keys. Failed listing pages cannot invent unknown tag keys.
Confirmed non-skills and deliberately excluded digest-only references do not
make an otherwise complete result partial. Later listing failures preserve
already discovered candidates and mark the result incomplete. Pagination cycles,
page limits, candidate limits, and serialized snapshot limits also prevent `ready`.

Successful `skills` entries use the `ai-skills-common` v1 OCI record contract:
verified digest and digest-addressed `sourceUri`, stable repository/tag key,
normalized metadata, and source-specific extensions. Raw YAML, Markdown, local
paths, and credentials are excluded. Records and failed keys have deterministic
Unicode code-point ordering. Responses are bounded to 1,000 records and 5 MiB
serialized JSON, with truncation represented as incomplete rather than `ready`.
The plugin publishes each completed snapshot atomically; concurrent requests see
either the old complete snapshot or its complete replacement.

**Response headers:**

| Header                 | Condition                                                                                                                                                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `X-Skilldocs-Revision` | Present on every completed `ready`, `partial`, or `failed` snapshot; absent on initial `loading`. A durable, monotonically increasing decimal string identifying the observation. Only the current `ready` revision may authorize cleanup; a revision on a `partial` or `failed` response does not permit release. |

### `GET /api/skill-image-connector/skilldocs/:sourceId/:digest`

Returns the extracted Markdown documentation for a single OCI skill image,
addressed by source ID and verified manifest digest. Backstage's default
backend authentication applies; this endpoint is not public.

**Path parameters:**

| Parameter   | Description                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `:sourceId` | Configured source ID (URL-encoded as a single path segment). Blank, `'.'`, and `'..'` return 404. |
| `:digest`   | OCI manifest digest in the format `sha256:<64 lowercase hex digits>`.                             |

**Responses:**

| Status | Condition                                                                                                                                                                                                  |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `200`  | Content found. Body is the extracted Markdown with `Content-Type: text/markdown`. An `ETag` header derived from the manifest digest is included.                                                           |
| `304`  | Conditional request: the `If-None-Match` header matches the current `ETag` (supports both strong and weak comparison, comma-separated lists, and the wildcard `*` per RFC 7232 §3.2). No body is returned. |
| `404`  | Unknown source ID, invalid digest format, unknown digest within the source, or content not yet available (source still loading). Returns a JSON object with an `error` string.                             |

Example successful response:

```http
HTTP/1.1 200 OK
Content-Type: text/markdown
ETag: "sha256:abcdef0123456789..."

# Hello World Skill

This is a skill document.
```

Example conditional request:

```http
GET /api/skill-image-connector/skilldocs/public-skills/sha256:abcdef... HTTP/1.1
If-None-Match: "sha256:abcdef..."
```

```http
HTTP/1.1 304 Not Modified
ETag: "sha256:abcdef..."
```

GET does not trigger registry acquisition. It serves current verified extraction
content or retained Markdown recovered from the database. Same-digest tag aliases share content and ETag
naturally because the digest is the content identity.

### `POST /api/skill-image-connector/skilldocs/:sourceId/reconcile`

Provider-authorized reconciliation acknowledgment endpoint. Allows the
configured catalog provider to acknowledge which skill digests it has
successfully consumed, enabling safe cleanup of unreferenced content from
durable storage.

**Authentication:** Requires Backstage service-to-service authentication.
The caller's principal must match `plugin:<catalogProviderPluginId>` (defaults
to `plugin:catalog`). Requests from other principals receive HTTP 403.

**Request body:**

```json
{
  "revision": "5",
  "retainedDigests": ["sha256:aaaa..."]
}
```

| Field             | Type       | Description                                                                                                            |
| ----------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `revision`        | `string`   | Required. Decimal string matching the `X-Skilldocs-Revision` header from the snapshot the caller consumed.             |
| `retainedDigests` | `string[]` | Required. Digests the caller has successfully ingested and wants retained. Max 1,000 unique `sha256:<64 hex>` entries. |

**Responses:**

| Status | Condition                                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `204`  | Acknowledgment accepted. Unreferenced digests (not in `retainedDigests` and not in the current snapshot) are cleaned up.        |
| `400`  | Invalid request body: missing or non-decimal `revision`, missing or invalid `retainedDigests`, duplicates, or too many entries. |
| `403`  | Unauthorized: caller is not the configured catalog provider or authentication failed.                                           |
| `404`  | Unknown source ID.                                                                                                              |
| `409`  | Revision mismatch, a current snapshot that is not ready, or a conflicting retain set for an already-acknowledged revision.      |
| `413`  | Request body exceeds 5 MiB.                                                                                                     |

**Idempotency:** Retrying the same `revision` and `retainedDigests` combination
returns 204 without additional side effects. The same `revision` with a
different `retainedDigests` set returns 409.

### Security model

**Egress / SSRF protection:** Initial registry, Quay discovery, bearer-token, and redirect requests use a per-request Undici dispatcher. The connector validates every DNS answer and restricts the socket lookup to that validated public address set, preserving the original hostname for TLS SNI and certificate verification. Node can fall back from unreachable IPv6 to IPv4 within the validated set. Fetch does not independently resolve a different destination. Private, loopback, link-local, multicast, reserved, and IPv4-mapped non-public addresses are rejected. Requests must use HTTPS; URL-embedded credentials and raw IP/localhost targets are rejected.

Redirects are limited to five. A source registry approved through its `allowedRegistries` may redirect to HTTPS on its original hostname or a subdomain of that hostname, on the same port. For example, `example.com` may redirect to `cdn.example.com` without separate configuration. This rule applies equally to all registries; there is no registry-specific host list. The hostname match requires a dot boundary, so `example.com.evil.test` and `notexample.com` are not covered. The rule is anchored to the initial registry throughout the redirect chain; explicitly allowing an unrelated origin does not automatically trust its subdomains. Source registry checks remain exact matches at startup.

Authorization is removed when crossing origins. Token realms still require the existing registry-host match or explicit `credentials.tokenRealm` configuration, and token requests never follow redirects. For unrelated CDN domains or different ports, configure the exact HTTPS origin in `sources[].allowedOrigins` (or
`skillImageConnector.allowedOrigins` for legacy flat configuration); wildcard hosts are not supported:

```yaml
skillImageConnector:
  allowedOrigins:
    - https://cdn.example.com
```

This optional setting adds trusted redirect destinations; omission allows only the registry hostname and its subdomains on the same HTTPS port. Entries must be HTTPS origins without credentials, paths, queries, or fragments. DNS validation and pinning also apply to explicitly allowed origins. Dispatchers close gracefully after response-body consumption or cancellation; failed requests destroy their dispatcher.

Tar archives are inspected for path traversal, symlinks, hardlinks, and device entries; unsafe archives are rejected without extracting content. Per-image work budgets and tar entry limits bound resource consumption from malicious or oversized images. Production deployments should restrict backend egress at the network layer in addition to the registry allowlist and HTTPS checks.

**Authorization:** The `/images`, `/skills/:sourceId`, and `/skilldocs/:sourceId/:digest` endpoints are accessible to all authenticated Backstage service-to-service callers. The content served is skill metadata (names, descriptions, documentation) — not registry credentials or secrets. Backstage's default service-to-service auth policy applies. The `/skilldocs/:sourceId/reconcile` endpoint requires the caller's principal to match `plugin:<catalogProviderPluginId>` (configurable, defaults to `catalog`); requests from other principals are rejected with HTTP 403. If per-skill visibility is required, add a [Backstage permission policy](https://backstage.io/docs/permissions/overview) check.

**Provenance:** When using mutable tag references, the plugin cannot guarantee that the content has not been replaced by the registry. Use digest-pinned references (`@sha256:...`) for production deployments. Manifest signature/provenance verification (e.g. cosign/sigstore) is not currently implemented; operators requiring supply-chain provenance should verify images externally before adding them to the configuration.

## OCI skill TechDocs verification

See the [task 6.5 verification matrix and maintainer instructions](../../openspec/changes/oci-npx-skills-registry-demo/verification.md)
for extraction-layout equivalence, connector/provider/reader integration, durable
retention/recovery, count/byte limits, acknowledgment races, and model-card
regression coverage. The combined fixture test runs without an external registry;
manual examples use the source IDs and authentication from your own configuration.
