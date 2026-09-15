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
  images:
    - imageRef: quay.io/gabemontero/hello-world-skill:1.0.0-draft
```

### Configuration fields

| Field                                   | Type     | Description                                                                              |
| --------------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `skillImageConnector.images`            | `array`  | List of OCI skill image sources to process on startup.                                   |
| `skillImageConnector.images[].imageRef` | `string` | Full OCI image reference (e.g. `quay.io/org/repo:tag` or `quay.io/org/repo@sha256:...`). |

All configuration fields have `@visibility backend` and are not exposed to the frontend.

## How it works

On startup the plugin:

1. Reads configured image references from `app-config.yaml`.
2. Fetches the OCI manifest from the registry using the Distribution Spec v2 HTTP API.
3. Validates the manifest contains layers annotated with `org.opencontainers.image.title` set to `skillimage.yaml` and `SKILLS.md`.
4. Downloads the layer blobs, verifies their SHA-256 digests, and writes them to a temporary directory.
5. Stores the extraction results in memory and exposes them via the `/api/skill-image-connector/images` endpoint.

## API

### `GET /api/skill-image-connector/health`

Returns `{ "status": "ok" }` when the plugin is running.

### `GET /api/skill-image-connector/images`

Returns the list of extracted skill images and their local file paths.
