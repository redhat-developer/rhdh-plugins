# Incremental Sync, Caching, Authentication, and Scale Validation

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Implements digest-based incremental sync with caching, K8s pull secret authentication, custom CA bundles, and validates performance at 2,000-image scale.

## EXISTING Requirements

None. This is a new incremental sync implementation.

## ADDED Requirements

### Requirement: Digest-Based Change Detection

The connector MUST detect skill changes by comparing current manifest digests against cached digests, avoiding redundant blob downloads.

#### Scenario: Detect changed skill via digest comparison

- **WHEN** the connector has cached digest `sha256:old123` for skill `quay.io/skills/my-skill:latest`
- **AND** the current manifest digest is `sha256:new456`
- **THEN** it marks the skill as changed
- **AND** it downloads the new skillcard blob for `sha256:new456`
- **AND** it re-emits the entity with updated metadata

#### Scenario: Skip unchanged skill

- **WHEN** the connector has cached digest `sha256:abc123` for skill `quay.io/skills/my-skill:latest`
- **AND** the current manifest digest is still `sha256:abc123`
- **THEN** it marks the skill as unchanged
- **AND** it skips blob download
- **AND** it does not re-emit the entity (no mutation)

#### Scenario: Detect removed skill

- **WHEN** the connector has cached digest for skill `quay.io/skills/old-skill:latest`
- **AND** the skill is no longer present in the tag listing response
- **THEN** it marks the skill as removed
- **AND** it includes the skill in the `removed` array for delta mutation

### Requirement: Delta Mutation Emission

The connector MUST emit incremental catalog updates using `applyMutation({ type: 'delta' })` to avoid full re-processing.

#### Scenario: Emit delta mutation with added and removed skills

- **WHEN** the connector detects 3 added skills, 2 changed skills, and 1 removed skill
- **THEN** it calls `applyMutation({ type: 'delta', added: [...5 entities...], removed: [...1 entity ref...] })`
- **AND** changed skills are included in the `added` array (Backstage catalog replaces by entity ref)
- **AND** unchanged skills are not included in the mutation

#### Scenario: Full mutation on first sync

- **WHEN** the connector runs for the first time with no cached digests
- **THEN** it calls `applyMutation({ type: 'full', entities: [...all discovered skills...] })`
- **AND** subsequent syncs use delta mutations

### Requirement: Durable Digest Cache

The connector MUST maintain a durable digest cache — an in-memory cache with disk persistence for durability across restarts. The in-memory layer provides runtime performance; the disk layer ensures the cache survives process restarts. If no disk cache exists on startup, the connector falls back to a full sync (safe, just slower).

#### Scenario: Cache digest after successful sync

- **WHEN** the connector successfully emits an entity for skill `quay.io/skills/my-skill:latest` with digest `sha256:abc123`
- **THEN** it stores the digest in the in-memory cache: `cache.set('quay.io/skills/my-skill:latest', { digest: 'sha256:abc123', lastSeen: Date.now() })`
- **AND** it sets a 5-minute TTL on the cache entry

#### Scenario: Cache expiration triggers re-validation

- **WHEN** a cache entry reaches its 5-minute TTL
- **THEN** the connector re-fetches the manifest to validate the digest
- **AND** if the digest is unchanged, it updates the `lastSeen` timestamp and resets the TTL
- **AND** if the digest has changed, it proceeds with blob download and entity emission

#### Scenario: Persist cache to disk on shutdown

- **WHEN** the Backstage backend shuts down gracefully
- **THEN** the connector writes the in-memory cache to `~/.backstage/cache/oci-skill-connector/digests.json`
- **AND** the file contains a JSON object mapping image refs to `{ digest, lastSeen, skillEntityRef }`

#### Scenario: Load cache from disk on startup

- **WHEN** the connector starts and `~/.backstage/cache/oci-skill-connector/digests.json` exists
- **THEN** it loads the cache into memory
- **AND** it treats all loaded entries as expired (5-minute TTL has passed) and re-validates digests in the first sync

### Requirement: K8s Pull Secret Authentication

The connector MUST authenticate to private OCI registries using Kubernetes pull secrets in Docker `config.json` format.

#### Scenario: Load credentials from K8s pull secret

- **WHEN** the connector is configured with `catalog.providers.ociSkill.registries[0].pullSecretPath: /var/run/secrets/pull-secret/.dockerconfigjson`
- **THEN** it reads the file and parses the Docker `config.json` format
- **AND** it extracts the `auths` object containing registry credentials
- **AND** it base64-decodes the `auth` field to get `username:password`

#### Scenario: Use credentials for OCI registry requests

- **WHEN** the connector sends a request to a private registry at `https://quay.io`
- **THEN** it includes an `Authorization: Basic <base64(username:password)>` header
- **AND** the registry authenticates the request successfully

#### Scenario: Handle missing or invalid pull secret

- **WHEN** the connector is configured with a pull secret path that does not exist
- **THEN** it logs an error indicating the file is missing
- **AND** it attempts to connect to the registry without credentials (public registries)
- **AND** if the registry requires authentication, it logs a 401 error

### Requirement: Custom CA Bundles for Air-Gapped Registries

The connector MUST support custom CA bundles for registries using self-signed certificates or internal CAs.

#### Scenario: Load custom CA bundle from mounted path

- **WHEN** the connector is configured with `catalog.providers.ociSkill.registries[0].tls.caFile: /etc/ssl/certs/custom-ca.crt`
- **THEN** it reads the PEM-encoded CA certificate(s) from the file
- **AND** it uses the shared CA utility from RHIDP-15316 to configure the HTTPS agent
- **AND** all requests to this registry trust the custom CA

#### Scenario: Use system CA bundle as fallback

- **WHEN** the connector is not configured with a custom CA bundle
- **THEN** it uses the system's default CA bundle (Node.js default)
- **AND** it can connect to registries with publicly trusted certificates

#### Scenario: Reject invalid CA bundle

- **WHEN** the connector is configured with a CA bundle file that contains invalid PEM data
- **THEN** it logs an error with file path and parse failure details
- **AND** it falls back to the system CA bundle (does not block startup)

### Requirement: Per-Registry Authentication Configuration

The connector MUST support multiple registries with distinct credentials and CA bundles.

#### Scenario: Configure multiple registries with different credentials

- **WHEN** the connector is configured with:
  ```yaml
  catalog:
    providers:
      ociSkill:
        registries:
          - url: https://quay.io
            namespace: skills
            pullSecretPath: /var/run/secrets/quay-pull-secret/.dockerconfigjson
          - url: https://harbor.internal
            namespace: ai-assets
            pullSecretPath: /var/run/secrets/harbor-pull-secret/.dockerconfigjson
            tls:
              caFile: /etc/ssl/certs/harbor-ca.crt
  ```
- **THEN** it authenticates to Quay with credentials from `quay-pull-secret`
- **AND** it authenticates to Harbor with credentials from `harbor-pull-secret` and trusts the custom CA

#### Scenario: Share credentials across registries (optional optimization)

- **WHEN** multiple registries use the same pull secret path
- **THEN** the connector loads the credentials once and reuses them
- **AND** it does not re-read the file for each registry

### Requirement: Air-Gapped Registry Support

The connector MUST function in air-gapped environments with no external network access, relying solely on internal registries.

#### Scenario: Discover skills from air-gapped registry

- **WHEN** the connector is deployed in an air-gapped environment with no internet access
- **AND** it is configured with `catalog.providers.ociSkill.registries[0].url: https://registry.internal`
- **THEN** it connects to the internal registry without attempting external DNS resolution
- **AND** it discovers skills normally

#### Scenario: Handle DNS resolution failure gracefully

- **WHEN** the connector is configured with a registry URL that cannot be resolved (e.g., `https://registry.external.com` in an air-gapped environment)
- **THEN** it logs an error indicating DNS resolution failure
- **AND** it does not retry indefinitely (fails fast after 3 attempts)

### Requirement: Scale Validation — 2,000 Skill Images

The connector MUST complete a full sync of 2,000 skill images within 5 minutes, using parallel manifest fetching and memory-bounded processing.

#### Scenario: Full sync performance target

- **WHEN** the connector discovers 2,000 skill images across all configured registries
- **THEN** it completes the full sync (manifest fetch + blob download + entity emission) within 5 minutes
- **AND** it achieves a throughput of at least ~6.7 images/second

#### Scenario: Parallel manifest fetching

- **WHEN** the connector is configured with `catalog.providers.ociSkill.discovery.concurrency: 20`
- **AND** it discovers 2,000 skill images
- **THEN** it fetches manifests in batches of 20 concurrent requests
- **AND** it completes all 2,000 manifest fetches within ~2 minutes (assuming 50ms per fetch)

#### Scenario: Memory-bounded processing

- **WHEN** the connector processes 2,000 skill images
- **THEN** it does not buffer all 2,000 manifests in memory at once
- **AND** it processes manifests in batches of 100 (configurable)
- **AND** peak memory usage stays below 500 MB (excluding Node.js runtime overhead)

#### Scenario: Incremental sync performance

- **WHEN** the connector has cached digests for 2,000 skills
- **AND** 200 skills have changed (10% churn)
- **THEN** it skips blob download for 1,800 unchanged skills
- **AND** it downloads blobs for 200 changed skills
- **AND** it completes the incremental sync within 2 minutes

#### Scenario: Mock registry test harness at scale

- **WHEN** the integration test suite creates a mock OCI registry with 2,000 skill images
- **THEN** the mock registry implements `GET /v2/<name>/tags/list`, `GET /v2/<name>/manifests/<ref>`, and `GET /v2/<name>/blobs/<digest>`
- **AND** it responds with synthetic manifests and skillcard blobs
- **AND** the test validates that the connector emits 2,000 entities within the 5-minute target
