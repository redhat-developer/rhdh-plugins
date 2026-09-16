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
      #   # Required when the token service is on another host.
      #   tokenRealm: https://auth.example.com/token
```

### Configuration fields

| Field                                      | Type     | Description                                                                                                                                           |
| ------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skillImageConnector.images`               | `array`  | List of OCI skill image sources to process on startup.                                                                                                |
| `skillImageConnector.images[].imageRef`    | `string` | Full OCI image reference (e.g. `quay.io/org/repo:tag` or `quay.io/org/repo@sha256:...`).                                                              |
| `skillImageConnector.images[].credentials` | `object` | Optional backend-only credentials for private registry token exchange. Add `tokenRealm` when the registry advertises a token service on another host. |
| `skillImageConnector.allowedRegistries`    | `array`  | Required exact registry host and port allowlist for configured images.                                                                                |

At most 25 images may be configured. Use immutable digest references in production deployments when reproducible content is required.

All configuration fields have `@visibility backend` and are not exposed to the frontend.

## How it works

On startup the plugin:

1. Reads configured image references from `app-config.yaml`.
2. Fetches the OCI manifest from the registry using the Distribution Spec v2 HTTP API.
3. Validates the manifest contains layers annotated with `org.opencontainers.image.title` set to `skillimage.yaml` and `SKILLS.md`.
4. Downloads the layer blobs, verifies their SHA-256 or SHA-512 digests, and writes them to a temporary directory.
5. Stores the extraction results in memory and exposes their contents via the `/api/skill-image-connector/images` endpoint.

## API

### `GET /api/skill-image-connector/health`

Returns `{ "status": "ok" }` when the plugin is running.

### `GET /api/skill-image-connector/images`

Returns the processing status and list of extracted skill images and their contents. During startup, `status` is `loading`; it becomes `ready` after all configured images have been processed, including failures. Local filesystem paths are intentionally not returned.

Example response:

```json
{
  "status": "ready",
  "images": [
    {
      "imageRef": "quay.io/gabemontero/hello-world-skill:1.0.0-draft",
      "skillImageYaml": "name: hello-world-skill\nversion: 1.0.0\n",
      "skillsMd": "# Hello World Skill\n"
    }
  ]
}
```
