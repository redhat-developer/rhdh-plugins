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
  images:
    - imageRef: quay.io/gabemontero/hello-world-skill:1.0.0-draft
      # Optional; use environment variable substitution for secrets.
      # credentials:
      #   username: ${OCI_REGISTRY_USERNAME}
      #   password: ${OCI_REGISTRY_PASSWORD}
      #   # Required when the token service is on another host, including
      #   # anonymous token exchange.
      #   tokenRealm: https://auth.example.com/token
```

### Configuration fields

| Field                                                 | Type     | Description                                                                                                 |
| ----------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `skillImageConnector.images`                          | `array`  | List of OCI skill image sources to process on startup.                                                      |
| `skillImageConnector.images[].imageRef`               | `string` | Full OCI image reference (e.g. `quay.io/org/repo:tag` or `quay.io/org/repo@sha256:...`).                    |
| `skillImageConnector.images[].credentials`            | `object` | Optional backend-only credentials or an explicit token realm for registry token exchange.                   |
| `skillImageConnector.images[].credentials.username`   | `string` | Registry username; required together with `password`.                                                       |
| `skillImageConnector.images[].credentials.password`   | `string` | Registry password; use environment variable substitution.                                                   |
| `skillImageConnector.images[].credentials.tokenRealm` | `string` | Optional HTTPS token endpoint; required for cross-host token exchange and must not contain URL credentials. |
| `skillImageConnector.allowedRegistries`               | `array`  | Required exact registry host and port allowlist for configured images.                                      |

At most 25 images may be configured. **Use immutable digest references (`@sha256:...`) in production.** Mutable tags can be moved or replaced by the registry; the plugin warns at startup when a tag reference is used. Digest-pinned references are verified against the manifest content, preventing tag mutation attacks.

Each extracted layer is limited to 5 MB. The aggregate in-memory content across all images is capped at 50 MB. All configuration fields use `@visibility backend` or `@visibility secret` and are not exposed to the frontend.

## How it works

On startup the plugin:

1. Cleans up stale extraction directories from any previous abnormal termination.
2. Reads configured image references from `app-config.yaml`.
3. Fetches the OCI manifest from the registry using the Distribution Spec v2 HTTP API.
4. Determines the extraction strategy:
   - **Annotated layers**: Two individual layers annotated with `org.opencontainers.image.title` set to `skillimage.yaml`/`skill.yaml` and `SKILLS.md`/`SKILL.md`.
   - **Tar archives**: One or more `tar` or `tar+gzip` layers (as produced by `skillctl`) containing the skill files as tar entries.
5. Downloads the layer blobs, verifies their SHA-256 or SHA-512 digests, extracts content (decompressing tar+gzip if needed), and writes files to a temporary directory.
6. Stores the extraction results in memory and exposes their contents via the `/api/skill-image-connector/images` endpoint.

Transient registry failures (network errors, 5xx responses) are retried up to 2 times with exponential backoff before marking an image as failed.

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

**Egress / SSRF protection:** The plugin resolves redirect target hostnames via DNS and rejects any that resolve to private, loopback, link-local, or reserved IP ranges (including IPv4-mapped IPv6). This prevents DNS-rebinding SSRF attacks through compromised registries. The registry allowlist and HTTPS checks complement but do not replace network-level egress controls; production deployments should also restrict backend egress at the network layer.

**Authorization:** The `/images` endpoint is accessible to all authenticated Backstage service-to-service callers. The content served is skill metadata (names, descriptions, documentation) — not registry credentials or secrets. Backstage's default service-to-service auth policy applies. If per-skill visibility is required, add a [Backstage permission policy](https://backstage.io/docs/permissions/overview) check.

**Provenance:** When using mutable tag references, the plugin cannot guarantee that the content has not been replaced by the registry. Use digest-pinned references (`@sha256:...`) for production deployments. Manifest signature/provenance verification (e.g. cosign/sigstore) is not currently implemented; operators requiring supply-chain provenance should verify images externally before adding them to the configuration.
