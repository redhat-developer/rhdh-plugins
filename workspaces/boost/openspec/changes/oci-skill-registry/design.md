# Design: OCI Skill Registry Connector

## Context

The Backstage Software Catalog provides an `EntityProvider` extension point for ingesting entities from external sources. The AI Catalog Entity Model defines a contract (entity provider SDK) that all AI asset connectors must implement. Skills are packaged as OCI container images with a `skillcard.yaml` manifest file embedded in the image layers.

The OCI Distribution Specification (https://github.com/opencontainers/distribution-spec) defines a standard HTTP API for registry operations. All target registries (Quay, GHCR, Docker Hub, Harbor, Artifactory, OpenShift Internal) implement this spec, providing:

- Manifest fetching: `GET /v2/<name>/manifests/<reference>`
- Blob downloading: `GET /v2/<name>/blobs/<digest>`
- Tag listing: `GET /v2/<name>/tags/list`

## Goals

- Ingest skills from any OCI-compliant registry into the Backstage Software Catalog
- Validate `skillcard.yaml` manifests against the SDK schema
- Support multiple registry instances with different auth mechanisms simultaneously
- Provide incremental sync via digest-based change detection
- Work in air-gapped environments (configurable endpoints, custom CA bundles, Secret-based credentials)
- Package as RHDH dynamic plugin

## Non-Goals

- Building a generic OCI artifact browser (only skills with `skillcard.yaml`)
- Supporting non-OCI image formats (Helm charts, Docker manifests v1, singularity images)
- Implementing a caching layer for OCI blobs (use registry-native caching)
- Providing a UI for registry configuration (use app-config YAML)

## Decisions

### Decision 1: Use `oras-js` (or equivalent Node.js OCI client)

The connector needs to:

1. List tags in a repository: `GET /v2/<name>/tags/list`
2. Fetch image manifests: `GET /v2/<name>/manifests/<reference>`
3. Download blobs: `GET /v2/<name>/blobs/<digest>`

We'll use a Node.js OCI Distribution Spec client library that supports:

- Manifest fetching (returns JSON with layers list)
- Blob downloading (returns binary content)
- Tag listing (returns JSON array of tags)
- Auth abstraction (handles Docker token auth, basic auth, bearer tokens)

Example usage:

```typescript
import { Registry } from 'oras';

const registry = new Registry(config.url, {
  auth: await resolveAuth(config.credentials),
  ca: config.customCA,
});

const tags = await registry.listTags(namespace, imageName);
const manifest = await registry.getManifest(namespace, imageName, tag);
const blob = await registry.getBlob(namespace, imageName, digest);
```

### Decision 2: Extract `skillcard.yaml` from OCI Image Layers

OCI images have a manifest with a `layers` array. Each layer is a blob identified by a digest. The `skillcard.yaml` file is embedded in one of these layers (typically as a tar archive entry).

Extraction flow:

1. Fetch manifest: `GET /v2/<name>/manifests/<tag>`
2. Parse manifest JSON to get `layers` array
3. For each layer digest:
   - Download blob: `GET /v2/<name>/blobs/<digest>`
   - If blob is tarball, extract `skillcard.yaml` from tar entries
   - If `skillcard.yaml` found, parse YAML and validate
4. If no `skillcard.yaml` found in any layer, reject artifact

Example manifest structure:

```json
{
  "schemaVersion": 2,
  "layers": [
    {
      "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
      "digest": "sha256:abc123...",
      "size": 1234
    }
  ]
}
```

We'll use `tar-stream` to parse layer tarballs without extracting to disk:

```typescript
const tarStream = tar.extract();
tarStream.on('entry', (header, stream, next) => {
  if (header.name === 'skillcard.yaml') {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => {
      const yaml = Buffer.concat(chunks).toString('utf-8');
      // validate and emit entity
    });
  }
  stream.resume();
  next();
});
```

### Decision 3: Digest-Based Change Detection

OCI registries provide content-addressable digests for images. A tag points to a digest. When a tag is re-pushed with different content, the digest changes.

The connector maintains a cursor: `Map<tag, digest>` (stored via `coreServices.cache`).

Change detection algorithm:

1. Fetch current tags: `GET /v2/<name>/tags/list` → `['v1.0.0', 'v1.1.0', 'latest']`
2. For each tag, fetch manifest to get digest: `GET /v2/<name>/manifests/<tag>` → `sha256:abc123...`
3. Compare against stored cursor:
   - **New tag** (not in cursor): Add entity
   - **Changed digest** (tag in cursor, different digest): Update entity
   - **Removed tag** (in cursor, not in current tags): Delete entity
   - **Unchanged** (tag in cursor, same digest): Skip
4. Update cursor with current `Map<tag, digest>`

Cursor storage:

```typescript
interface SyncCursor {
  registryId: string;
  namespace: string;
  imageName: string;
  tagDigestMap: Record<string, string>; // { "v1.0.0": "sha256:abc123...", ... }
  lastSync: string; // ISO timestamp
}
```

Full refresh fallback triggers when:

- Cursor doesn't exist (first run)
- Cursor schema version mismatch (after SDK upgrade)
- Cursor exceeds max age (configurable TTL)

### Decision 4: Entity Emission Pattern

Each skill becomes an `AIResource` entity with:

- `kind: AIResource`
- `spec.type: skill`
- `metadata.name`: derived from `skillcard.yaml` name field (sanitized to `[a-z0-9-]+`)
- `metadata.namespace`: from registry instance config (default: `default`)
- `metadata.annotations`:
  - `rhdh.io/ai-asset-category: skill`
  - `rhdh.io/ai-asset-version`: from `skillcard.yaml` version field
  - `rhdh.io/ai-asset-source`: `oci-skill-registry/<instance-id>` (per annotation-scheme spec)
  - `rhdh.io/oci-registry-url`: full registry URL
  - `rhdh.io/oci-image-name`: `namespace/imageName`
  - `rhdh.io/oci-digest`: current digest
  - `rhdh.io/oci-tag`: tag used for this entity

Example entity:

```yaml
apiVersion: backstage.io/v1alpha1
kind: AIResource
metadata:
  name: pdf-processor
  namespace: default
  annotations:
    rhdh.io/ai-asset-category: skill
    rhdh.io/ai-asset-version: 1.2.0
    rhdh.io/ai-asset-source: oci-skill-registry/default
    rhdh.io/oci-registry-url: https://quay.io
    rhdh.io/oci-image-name: myorg/skills/pdf-processor
    rhdh.io/oci-digest: sha256:abc123...
    rhdh.io/oci-tag: v1.2.0
spec:
  type: skill
  owner: team-ai
```

### Decision 5: Per-Registry Authentication Abstraction

Different registries use different auth mechanisms:

- **Docker Hub**: Docker token auth (POST to `https://auth.docker.io/token`)
- **GHCR**: Bearer tokens (GitHub PAT in `Authorization: Bearer <token>`)
- **Quay**: Basic auth (username/password or robot account token)
- **Harbor**: Basic auth (username/password or robot account token)
- **Artifactory**: Basic auth (username/API key)
- **OpenShift Internal**: Bearer tokens (service account token in `Authorization: Bearer <token>`)

We'll define an `AuthProvider` interface:

```typescript
interface AuthProvider {
  getAuthHeaders(requestUrl: string): Promise<Record<string, string>>;
}

class BasicAuthProvider implements AuthProvider {
  constructor(
    private username: string,
    private password: string,
  ) {}
  async getAuthHeaders() {
    const encoded = Buffer.from(`${this.username}:${this.password}`).toString(
      'base64',
    );
    return { Authorization: `Basic ${encoded}` };
  }
}

class BearerTokenAuthProvider implements AuthProvider {
  constructor(private token: string) {}
  async getAuthHeaders() {
    return { Authorization: `Bearer ${this.token}` };
  }
}

class DockerTokenAuthProvider implements AuthProvider {
  constructor(
    private username: string,
    private password: string,
  ) {}
  async getAuthHeaders(requestUrl: string) {
    // Extract scope from request URL
    // POST to https://auth.docker.io/token with scope
    // Return { Authorization: `Bearer <token>` }
  }
}
```

Registry config specifies auth type:

```yaml
ai-catalog-oci-skill-registry:
  registries:
    - id: quay-internal
      url: https://quay.internal.corp
      auth:
        type: basic
        secretRef: quay-robot-account
    - id: ghcr
      url: https://ghcr.io
      auth:
        type: bearer
        secretRef: github-pat
    - id: dockerhub
      url: https://registry-1.docker.io
      auth:
        type: docker-token
        secretRef: dockerhub-credentials
```

### Decision 6: Package as RHDH Dynamic Plugin

The connector is a Backstage backend module that extends the catalog plugin:

```typescript
import { createBackendModule } from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';

export const aiCatalogOciSkillRegistryModule = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'ai-catalog-oci-skill-registry',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
      },
      async init({ catalog, config, logger, scheduler }) {
        const provider = OciSkillRegistryProvider.fromConfig(config, {
          logger,
          scheduler,
        });
        catalog.addEntityProvider(provider);
      },
    });
  },
});
```

RHDH dynamic plugin export:

```typescript
// dynamic-plugins/dist/backstage-plugin-catalog-backend-module-ai-catalog-oci-skill-registry/package.json
{
  "name": "@red-hat/backstage-plugin-catalog-backend-module-ai-catalog-oci-skill-registry",
  "version": "1.0.0",
  "backstage": {
    "role": "backend-plugin-module"
  },
  "exports": {
    ".": "./src/index.ts",
    "./alpha": "./src/alpha.ts"
  }
}
```

## Risks

**Risk 1: Large namespace performance**

Ingesting a namespace with 1,945 images on first run may timeout or exhaust memory. Each image requires:

- 1 manifest fetch (few KB)
- N blob downloads (skillcard.yaml is small, <10 KB typically)

Mitigation:

- Stream processing: Don't load all tags into memory, process in batches
- Parallel fetching: Download manifests concurrently (limit concurrency to avoid rate limits)
- Incremental sync from second run onward dramatically reduces subsequent load

**Risk 2: Registry API rate limits**

Public registries (Docker Hub, GHCR) have rate limits (e.g., Docker Hub: 100 pulls/6 hours for anonymous, 200 for authenticated).

Mitigation:

- Require authentication (never use anonymous access)
- Respect HTTP 429 responses and `Retry-After` headers
- Configurable sync interval per registry (default: 30 minutes, recommend 60 minutes for public registries)
- Cache manifest responses in plugin state to avoid redundant fetches

**Risk 3: Invalid `skillcard.yaml` schema evolution**

The SDK schema may evolve. Old skills in the registry may have outdated `skillcard.yaml` files.

Mitigation:

- Schema versioning: `skillcard.yaml` includes `schemaVersion: 1`
- Backward-compatible validation: Validate against SDK schema, but allow extra fields
- Reject skills with missing required fields, emit warning logs with skill name/tag
- Don't abort entire sync when one skill fails validation (isolate failures)

**Risk 4: Air-gapped CA bundle trust**

Custom CA certificates may not be honored by the OCI client library.

Mitigation:

- Test with `oras-js` or equivalent — verify it respects Node.js `https.Agent` with custom CA
- If library doesn't support, fork and patch or use lower-level HTTP client with custom agent
- Provide clear documentation on mounting CA bundle ConfigMaps in deployment YAML
