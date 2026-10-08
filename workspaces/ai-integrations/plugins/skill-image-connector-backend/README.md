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
  # maxDiscoveryResponseSizeBytes: 5242880
  # maxImages: 25
  # maxRetries: 2
  # retryBaseDelayMs: 2000
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

Both explicit images and Quay discovery can be used together. Discovered repository/tag references are merged with explicit images; duplicate full references are skipped. Different tags remain separate even when they point to the same manifest digest.

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
reported as discovery failure, not as an empty repository. The current raw
`/images` endpoint retains its existing status/failure behavior; normalized
snapshots and periodic refresh remain follow-up work.

Only successfully extracted skill images appear in `/images`; a container
without the required skill files is not an accepted result. Different tags with
the same content still appear separately. The OpenSpec catalog design likewise
requires one entity per valid skill-image tag, keyed by
`<registry>/<repository>:<tag>`; this plugin does not create catalog entities.

### Configuration fields

| Field                                                 | Type     | Description                                                                                                                   |
| ----------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `skillImageConnector.images`                          | `array`  | List of OCI skill image sources to process on startup.                                                                        |
| `skillImageConnector.images[].imageRef`               | `string` | Full OCI image reference (e.g. `quay.io/org/repo:tag` or `quay.io/org/repo@sha256:...`).                                      |
| `skillImageConnector.images[].credentials`            | `object` | Optional backend-only credentials or an explicit token realm for registry token exchange.                                     |
| `skillImageConnector.images[].credentials.username`   | `string` | Registry username; required together with `password`.                                                                         |
| `skillImageConnector.images[].credentials.password`   | `string` | Registry password; use environment variable substitution.                                                                     |
| `skillImageConnector.images[].credentials.tokenRealm` | `string` | Optional HTTPS token endpoint; required for cross-host token exchange and must not contain URL credentials.                   |
| `skillImageConnector.allowedRegistries`               | `array`  | Required exact registry host and port allowlist for configured images and discovery registries.                               |
| `skillImageConnector.quayDiscovery`                   | `object` | Optional public Quay organization discovery configuration.                                                                    |
| `skillImageConnector.quayDiscovery.registry`          | `string` | Quay registry host (defaults to `quay.io`).                                                                                   |
| `skillImageConnector.quayDiscovery.organization`      | `string` | Public organization whose repositories will be discovered. Omission or a blank value skips discovery with a warning.          |
| `skillImageConnector.quayDiscovery.tag`               | `string` | Optional exact tag filter. Omit or leave blank to enumerate all active tags; set `latest` explicitly for the former behavior. |

By default, at most 25 image candidates are processed, including explicit images and discovered repository/tag candidates. Set `skillImageConnector.maxImages` to raise or lower this total (for example, `100` to attempt up to 100 distinct image references). A repository with many tags consumes multiple candidate slots; increasing this cap does not guarantee every tag fits. Explicit images take priority, and discovered references already present in the explicit list do not consume another slot. An explicit list exceeding the limit fails startup validation; excess discovered candidates are skipped with a warning. This bounds candidates attempted, not successful skill extractions: repositories without the selected tag still consume a slot. It does not change the concurrency limit of four image operations.

**Use immutable digest references (`@sha256:...`) in production.** Mutable tags can be moved or replaced by the registry; the plugin warns at startup when a tag reference is used. Digest-pinned references are verified against the manifest content, preventing tag mutation attacks.

By default, each downloaded blob and decompressed layer is limited to 5 MiB. The combined retained UTF-8 `skillimage.yaml` and `SKILLS.md` content across accepted images is capped at 50 MiB. This retained-content budget does not measure total downloads or peak process memory. All configuration fields use `@visibility backend` or `@visibility secret` and are not exposed to the frontend.

### Optional acquisition limits

All of these backend-only settings are optional. Omitted settings use the shared defaults; supplied values are validated at startup. Backstage numeric environment substitutions are supported. Byte limits, delays, and `maxImages` must be positive safe integers; `maxRetries` must be a nonnegative safe integer. Timeout and base-delay values must not exceed 2,147,483,647 ms (Node's timer limit).

| Field under `skillImageConnector` | Default    | Scope                                                                                        |
| --------------------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `fetchTimeoutMs`                  | `30000`    | One discovery attempt or OCI request, including redirects, authentication, and body reading. |
| `maxBlobSizeBytes`                | `5242880`  | Both the compressed/downloaded blob and the decompressed layer, checked separately.          |
| `maxAggregateContentSizeBytes`    | `52428800` | Combined retained skill YAML and Markdown across accepted images.                            |
| `maxDiscoveryResponseSizeBytes`   | `5242880`  | One discovery response, enforced during streaming even without Content-Length.               |
| `maxImages`                       | `25`       | Combined explicit images and discovered candidates attempted at startup.                     |
| `maxRetries`                      | `2`        | Retries after the initial page or image acquisition attempt. Set `0` to disable.             |
| `retryBaseDelayMs`                | `2000`     | Initial backoff; doubled for each further retry and capped at Node's timer limit.            |

Manifest responses retain their separate 5 MiB limit; token responses retain their 1 MiB limit. Repository and tag pagination (100 pages combined), redirects (three), concurrent image operations (four), and tar entries (200) also have distinct shared defaults. The image retry wraps the whole acquisition/extraction; individual OCI requests do not add another retry loop.

Discovery and OCI requests share HTTP redirect validation, response cleanup, and bounded body reading. Redirects must use HTTPS, reject URL credentials, localhost and literal IPs, and pass a DNS check for non-public destinations. Authorization headers are removed when following cross-origin redirects. These checks do not replace the future D7 configured-origin policy or implement normalized snapshots.

## How it works

On startup the plugin:

1. Cleans up stale extraction directories from any previous abnormal termination.
2. Reads configured image references from `app-config.yaml`.
3. If `quayDiscovery` is configured, discovers public repositories using paginated API calls. With no tag filter, it then lists active tags for each repository; an exact tag filter skips tag listing. Distinct references are sorted before merging with the explicit image list and applying `maxImages`.
4. Fetches the OCI manifest from the registry using the Distribution Spec v2 HTTP API.
5. Determines the extraction strategy:
   - **Annotated layers**: Two individual layers annotated with `org.opencontainers.image.title` set to `skillimage.yaml`/`skill.yaml` and `SKILLS.md`/`SKILL.md`.
   - **Tar archives**: One or more `tar` or `tar+gzip` layers (as produced by `skillctl`) containing the skill files as tar entries.
6. Downloads the layer blobs, verifies their SHA-256 or SHA-512 digests, extracts content (decompressing tar+gzip if needed), and writes files to a temporary directory.
7. Stores the extraction results in memory and exposes their contents via the `/api/skill-image-connector/images` endpoint.

Transient discovery and registry failures (network errors including wrapped fetch causes, HTTP 5xx, and request timeouts) are retried up to two times by default, with 2-second then 4-second backoff. Discovery retries one page with a fresh timeout each time; image processing retries the full acquisition/extraction. Validation failures, size violations, malformed JSON, and non-5xx HTTP failures are not retried. Shutdown cancels active requests and backoff promptly. OCI authentication challenges are handled separately within the same request deadline.

A discovered repository may not have an explicitly selected tag, and an enumerated tag can disappear before acquisition. HTTP 404 failures while
acquiring discovered images are logged only at debug level; explicitly configured
images retain their error diagnostics because their references are expected to
exist. When discovery finds an explicitly configured reference, the explicit
reporting policy wins. The internal `logNotFoundAsError` flag selects this behavior;
it is not an additional app-config setting. Other acquisition errors and a 404
from the Quay organization-listing endpoint are still reported. Missing images
remain in `failedImages`, and the existing `/images` status calculation is unchanged.

## API

### `GET /api/skill-image-connector/health`

Returns `{ "status": "ok" }` when the plugin is running.

### `GET /api/skill-image-connector/images`

Returns the processing status, failed image references, and list of extracted skill images and their contents. During startup, `status` is `loading`; it becomes `ready` after all configured images have been processed when at least one image succeeded, or `failed` when every configured image failed. Failed images are omitted from `images` and listed in `failedImages`. Local filesystem paths are intentionally not returned.

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

### Security model

**Egress / SSRF protection:** The plugin resolves redirect target hostnames via DNS and rejects any that resolve to private, loopback, link-local, or reserved IP ranges (including IPv4-mapped IPv6). This is a preflight check: the subsequent fetch resolves DNS independently, so the check does not prevent DNS rebinding between validation and connection. Connection-level destination validation remains part of OpenSpec task 2.4. Production deployments should restrict backend egress at the network layer in addition to the registry allowlist and HTTPS checks.

**Authorization:** The `/images` endpoint is accessible to all authenticated Backstage service-to-service callers. The content served is skill metadata (names, descriptions, documentation) — not registry credentials or secrets. Backstage's default service-to-service auth policy applies. If per-skill visibility is required, add a [Backstage permission policy](https://backstage.io/docs/permissions/overview) check.

**Provenance:** When using mutable tag references, the plugin cannot guarantee that the content has not been replaced by the registry. Use digest-pinned references (`@sha256:...`) for production deployments. Manifest signature/provenance verification (e.g. cosign/sigstore) is not currently implemented; operators requiring supply-chain provenance should verify images externally before adding them to the configuration.
