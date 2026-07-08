# Multi-Registry Support and Air-Gapped Configuration

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.
>
> **Cross-connector dependencies:** RHIDP-15297 is blocked by RHIDP-15265 (endpoint/credential config patterns), RHIDP-15329 (CA bundle utility), and RHIDP-15266 (reference Helm/Operator CR configs). The endpoint, credential, and TLS requirements below implement OCI-specific variants of the shared patterns those stories define.

The OCI Skill Registry connector supports multiple registry instances with different auth mechanisms, configurable endpoints (no hardcoded SaaS URLs), custom CA bundles, and Secret-based credentials. This enables air-gapped deployments and hybrid registry environments.

## ADDED Requirements

### Requirement: Support Multiple Auth Mechanisms

The connector supports auth for Quay, GHCR, Docker Hub, Harbor, Artifactory, and OpenShift Internal Image Registry.

#### Scenario: Authenticate with Quay (Basic Auth)

- **WHEN** the app-config contains:
  ```yaml
  ai-catalog-oci-skill-registry:
    registries:
      - id: quay-internal
        url: https://quay.internal.corp
        auth:
          type: basic
          secretRef: quay-robot-account
  ```
- **AND** the Secret `quay-robot-account` contains `username: robot-user` and `password: xyz123`
- **THEN** the connector uses `Authorization: Basic <base64(robot-user:xyz123)>` for all Quay API calls

#### Scenario: Authenticate with GHCR (Bearer Token)

- **WHEN** the app-config contains:
  ```yaml
  ai-catalog-oci-skill-registry:
    registries:
      - id: ghcr
        url: https://ghcr.io
        auth:
          type: bearer
          secretRef: github-pat
  ```
- **AND** the Secret `github-pat` contains `token: ghp_abc123...`
- **THEN** the connector uses `Authorization: Bearer ghp_abc123...` for all GHCR API calls

#### Scenario: Authenticate with Docker Hub (Token Auth)

- **WHEN** the app-config contains:
  ```yaml
  ai-catalog-oci-skill-registry:
    registries:
      - id: dockerhub
        url: https://registry-1.docker.io
        auth:
          type: docker-token
          secretRef: dockerhub-credentials
  ```
- **AND** the Secret `dockerhub-credentials` contains `username: myuser` and `password: secret`
- **THEN** the connector:
  1. Extracts scope from request URL (e.g., `repository:myuser/skills:pull`)
  2. Calls `POST https://auth.docker.io/token?service=registry.docker.io&scope=<scope>` with Basic Auth
  3. Receives `{ "token": "jwt_token..." }`
  4. Uses `Authorization: Bearer <jwt_token>` for subsequent registry API calls

#### Scenario: Authenticate with OpenShift Internal Registry (Service Account Token)

- **WHEN** the app-config contains:
  ```yaml
  ai-catalog-oci-skill-registry:
    registries:
      - id: openshift-internal
        url: https://image-registry.openshift-image-registry.svc:5000
        auth:
          type: bearer
          secretRef: openshift-sa-token
  ```
- **AND** the Secret `openshift-sa-token` contains `token: eyJhbGci...`
- **THEN** the connector uses `Authorization: Bearer eyJhbGci...` for all OpenShift registry API calls

### Requirement: Configurable Registry Endpoints (No Hardcoded SaaS URLs)

The connector requires explicit registry URLs in app-config, with no hardcoded defaults for SaaS registries.

#### Scenario: Configure internal Quay instance

- **WHEN** the app-config contains:
  ```yaml
  ai-catalog-oci-skill-registry:
    registries:
      - id: quay-internal
        url: https://quay.internal.corp
        namespaces: [myorg/skills]
  ```
- **THEN** the connector calls `https://quay.internal.corp/v2/myorg/skills/tags/list`
- **AND** does not make any requests to `quay.io`

#### Scenario: Reject missing registry URL

- **WHEN** the app-config contains:
  ```yaml
  ai-catalog-oci-skill-registry:
    registries:
      - id: ghcr
        namespaces: [myorg/skills]
  ```
- **AND** no `url` field is present
- **THEN** the connector fails at startup with error: `Registry "ghcr" missing required field "url"`

#### Scenario: Support multiple registry instances

- **WHEN** the app-config contains:
  ```yaml
  ai-catalog-oci-skill-registry:
    registries:
      - id: quay-internal
        url: https://quay.internal.corp
        namespaces: [myorg/skills]
      - id: ghcr-external
        url: https://ghcr.io
        namespaces: [open-source-org/skills]
  ```
- **THEN** the connector runs separate sync cycles for each registry
- **AND** emits entities with `metadata.annotations.rhdh.io/ai-asset-source` set to the respective registry URL

### Requirement: Custom CA Bundles for TLS

The connector honors custom CA certificates for all HTTPS connections to registries.

#### Scenario: Use custom CA bundle from ConfigMap

- **WHEN** the app-config contains:
  ```yaml
  ai-catalog-oci-skill-registry:
    registries:
      - id: quay-internal
        url: https://quay.internal.corp
        tls:
          caConfigMap: internal-ca-bundle
          caKey: ca.crt
  ```
- **AND** the ConfigMap `internal-ca-bundle` contains `ca.crt: -----BEGIN CERTIFICATE-----...`
- **THEN** the connector loads the CA certificate
- **AND** configures the HTTPS agent with `ca: <cert_content>`
- **AND** all HTTPS requests to `quay.internal.corp` validate TLS with the custom CA

#### Scenario: Use custom CA bundle from Secret

- **WHEN** the app-config contains:
  ```yaml
  ai-catalog-oci-skill-registry:
    registries:
      - id: harbor
        url: https://harbor.internal.corp
        tls:
          caSecret: harbor-ca
          caKey: tls.crt
  ```
- **AND** the Secret `harbor-ca` contains `tls.crt: -----BEGIN CERTIFICATE-----...`
- **THEN** the connector loads the CA certificate from the Secret
- **AND** configures the HTTPS agent with `ca: <cert_content>`

#### Scenario: Reject self-signed cert without CA bundle

- **WHEN** the registry uses a self-signed certificate
- **AND** no `tls.caConfigMap` or `tls.caSecret` is configured
- **THEN** the connector fails TLS validation with error: `UNABLE_TO_VERIFY_LEAF_SIGNATURE`
- **AND** logs error: `TLS verification failed for quay.internal.corp, configure custom CA bundle`

### Requirement: Secret-Based Credentials Only

The connector rejects plaintext credentials in app-config and requires K8s Secret references.

#### Scenario: Reject plaintext credentials

- **WHEN** the app-config contains:
  ```yaml
  ai-catalog-oci-skill-registry:
    registries:
      - id: quay-internal
        url: https://quay.internal.corp
        auth:
          type: basic
          username: robot-user
          password: xyz123
  ```
- **THEN** the connector fails at startup with error: `Registry "quay-internal" has plaintext credentials, use secretRef instead`

#### Scenario: Validate Secret exists at startup

- **WHEN** the app-config contains:
  ```yaml
  ai-catalog-oci-skill-registry:
    registries:
      - id: quay-internal
        url: https://quay.internal.corp
        auth:
          type: basic
          secretRef: missing-secret
  ```
- **AND** the Secret `missing-secret` does not exist
- **THEN** the connector fails at startup with error: `Secret "missing-secret" not found for registry "quay-internal"`

#### Scenario: Validate Secret has required keys

- **WHEN** the app-config specifies `auth.type: basic` and `secretRef: quay-robot-account`
- **AND** the Secret `quay-robot-account` only contains `username: robot-user` (missing `password`)
- **THEN** the connector fails at startup with error: `Secret "quay-robot-account" missing required key "password" for basic auth`

### Requirement: K8s Pull Secret Pattern as Primary Credential Mechanism

> _Added from RHIDP-15294 updated ACs (2026-07-08 consolidation)_

The connector MUST support Kubernetes pull secrets (`kubernetes.io/dockerconfigjson`) as the primary credential mechanism, alongside the existing `secretRef` pattern.

#### Scenario: Authenticate using K8s pull secret

- **WHEN** the app-config contains:
  ```yaml
  ai-catalog-oci-skill-registry:
    registries:
      - id: quay-internal
        url: https://quay.internal.corp
        auth:
          type: pull-secret
          pullSecretRef: quay-pull-secret
  ```
- **AND** the Secret `quay-pull-secret` has `type: kubernetes.io/dockerconfigjson` with `.dockerconfigjson` containing auth for `quay.internal.corp`
- **THEN** the connector extracts credentials from the pull secret's `.dockerconfigjson` for the matching registry URL
- **AND** uses the extracted credentials for all API calls to `quay.internal.corp`

#### Scenario: Pull secret with multiple registry entries

- **WHEN** the pull secret `.dockerconfigjson` contains auth entries for `quay.internal.corp`, `ghcr.io`, and `registry-1.docker.io`
- **AND** the registry config specifies `url: https://quay.internal.corp`
- **THEN** the connector selects only the auth entry matching `quay.internal.corp`
- **AND** ignores entries for other registries

#### Scenario: Missing registry entry in pull secret

- **WHEN** the pull secret `.dockerconfigjson` does not contain an auth entry for the configured registry URL
- **THEN** the connector fails at startup with error: `Pull secret "quay-pull-secret" has no auth entry for registry "quay.internal.corp"`

#### Scenario: Pull secret preferred over explicit secretRef

- **WHEN** both `pullSecretRef` and `secretRef` are specified for a registry
- **THEN** the connector fails at startup with error: `Registry "quay-internal" has both pullSecretRef and secretRef. Use only one credential source.`

### Requirement: Independent Sync Intervals Per Registry

The connector allows configurable sync intervals for each registry instance.

#### Scenario: Configure different sync intervals

- **WHEN** the app-config contains:
  ```yaml
  ai-catalog-oci-skill-registry:
    registries:
      - id: quay-internal
        url: https://quay.internal.corp
        namespaces: [myorg/skills]
        syncInterval: 15m
      - id: dockerhub
        url: https://registry-1.docker.io
        namespaces: [publicorg/skills]
        syncInterval: 60m
  ```
- **THEN** the connector schedules Quay sync every 15 minutes
- **AND** schedules Docker Hub sync every 60 minutes
- **AND** each registry's sync runs independently without blocking the other

#### Scenario: Default sync interval

- **WHEN** no `syncInterval` is specified for a registry
- **THEN** the connector uses default interval of 30 minutes

#### Scenario: Reject invalid sync interval

- **WHEN** the app-config contains `syncInterval: 1s` (less than minimum)
- **THEN** the connector fails at startup with error: `Registry "quay-internal" syncInterval must be at least 1m`

### Requirement: Simultaneous Multi-Registry Operation

The connector supports multiple registry instances running sync cycles simultaneously.

#### Scenario: Concurrent syncs for different registries

- **WHEN** the connector is configured with 3 registries: Quay, GHCR, Harbor
- **THEN** each registry's sync cycle runs in parallel (separate scheduled tasks)
- **AND** a failure in one registry's sync does not abort other registries' syncs

#### Scenario: Namespace collision handling

- **WHEN** Quay registry emits entity `pdf-processor` in namespace `default`
- **AND** GHCR registry emits entity `pdf-processor` in namespace `default`
- **THEN** the connector emits both entities with unique entity refs:
  - `resource:default/pdf-processor-quay-internal` (suffix from registry ID)
  - `resource:default/pdf-processor-ghcr-external`
- **AND** logs warning: `Entity name collision for "pdf-processor", disambiguated with registry ID`
