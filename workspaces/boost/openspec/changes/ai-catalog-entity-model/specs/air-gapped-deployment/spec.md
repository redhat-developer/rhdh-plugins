# Air-Gapped Deployment Support

> **Status: Moved to RHIDP-15316 (Cross-Connector Shared Infrastructure, RHDHPLAN-1510)** — Air-gapped patterns are cross-connector concerns. CA bundle scope → RHIDP-15329, credentials/endpoints → RHIDP-15265, reference configs → RHIDP-15266. Story RHIDP-15264 has been closed (scope split into RHIDP-15329 and RHIDP-15265). See `openspec/changes/connector-shared-infrastructure/` for the authoritative CA bundle (`loadCaBundle`), fault isolation (`createProviderWrapper`), and reference app-config specifications.

Enterprise air-gapped deployment readiness: custom CA bundles for TLS, K8s Secret-only credentials with startup validation rejecting plaintext, and configurable endpoint URLs with no hardcoded SaaS defaults.

## ADDED Requirements

### Requirement: Custom CA Bundle Support

Entity providers MUST honor custom CA bundles from mounted Secret/ConfigMap for all TLS connections.

#### Scenario: CA bundle via NODE_EXTRA_CA_CERTS (RHIDP-15329, RHIDP-15265)

- **WHEN** the `NODE_EXTRA_CA_CERTS=/etc/ssl/certs/custom-ca.pem` environment variable is set (pointing to a mounted Secret/ConfigMap)
- **THEN** all HTTPS connections from the entity provider honor the custom CA bundle
- **AND** connections to registries with certificates signed by the custom CA succeed

#### Scenario: CA bundle via explicit https.Agent (RHIDP-15329, RHIDP-15265)

- **WHEN** an entity provider initializes an HTTP client
- **THEN** it reads the custom CA from app-config (e.g., `boost.providers.kagenti.caCertPath: /etc/ssl/certs/custom-ca.pem`)
- **AND** it creates an `https.Agent` with `ca: fs.readFileSync(caCertPath)`
- **AND** all HTTPS requests use this agent

#### Scenario: Configuration schema documented (RHIDP-15329, RHIDP-15265)

- **WHEN** the SDK or provider module is documented
- **THEN** the README includes an example showing how to mount a CA bundle via Helm/Operator CR
- **AND** the example shows both `NODE_EXTRA_CA_CERTS` and explicit `caCertPath` configuration

### Requirement: K8s Secret-Only Credentials

Entity providers MUST accept K8s Secret references for all credentials and reject plaintext credentials at startup.

#### Scenario: Credential reference format (RHIDP-15329, RHIDP-15265)

- **WHEN** app-config specifies credentials via K8s Secrets mounted as environment variables
- **THEN** the format uses standard Backstage `$env` resolvers:
  ```yaml
  boost:
    providers:
      kagenti:
        clientId:
          $env: KAGENTI_CLIENT_ID
        clientSecret:
          $env: KAGENTI_CLIENT_SECRET
  ```
- **AND** the K8s Secret is mounted into the container as env vars via Helm values or Operator CR (see reference configs below)

#### Scenario: Plaintext credentials rejected at startup (RHIDP-15329, RHIDP-15265)

- **WHEN** app-config specifies credentials as plaintext strings (e.g., `clientSecret: "my-secret"` instead of `$env`)
- **THEN** the provider throws at startup: `Error: Plaintext credentials not allowed. Use $env references backed by mounted K8s Secrets.`
- **AND** the Backstage backend fails to start with a descriptive error message

#### Scenario: Startup validation with descriptive errors (RHIDP-15329, RHIDP-15265)

- **WHEN** the provider module initializes
- **THEN** it validates all credential fields use `$env` references (backed by mounted K8s Secrets)
- **AND** it validates the secret name and key are non-empty strings
- **AND** if validation fails, the error message includes: which field failed, expected format, example correct configuration

### Requirement: Configurable Endpoint URLs

All registry endpoint URLs MUST be configurable via app-config with no hardcoded SaaS defaults.

#### Scenario: Endpoint URLs configurable (RHIDP-15265)

- **WHEN** app-config specifies a custom endpoint:
  ```yaml
  boost:
    providers:
      kagenti:
        baseUrl: https://kagenti.internal.corp
  ```
- **THEN** the provider connects to `https://kagenti.internal.corp` instead of any hardcoded SaaS URL
- **AND** no code change is required to switch registries

#### Scenario: Startup validation for URL syntax (RHIDP-15265)

- **WHEN** app-config specifies an invalid URL (e.g., `baseUrl: "not-a-url"`)
- **THEN** the provider throws at startup: `Error: Invalid baseUrl 'not-a-url'. Must be a valid HTTPS URL.`
- **AND** the error message includes the expected format (e.g., `https://example.com`)

#### Scenario: Configuration schema documented (RHIDP-15265)

- **WHEN** the provider module is documented
- **THEN** the README includes the full configuration schema with: `baseUrl`, `caCertPath`, credential `$env` references, sync schedule
- **AND** the schema specifies default values (if any) and required fields

### Requirement: Reference Air-Gapped Configuration

Reference app-config YAML, Helm values, and Operator CR examples MUST be provided.

#### Scenario: Reference app-config YAML (RHIDP-15266)

- **WHEN** a developer sets up an air-gapped connector
- **THEN** they can copy the reference app-config from the SDK README:
  ```yaml
  boost:
    providers:
      kagenti:
        baseUrl: https://kagenti.internal.corp
        caCertPath: /etc/ssl/certs/custom-ca.pem
        clientId:
          $env: KAGENTI_CLIENT_ID
        clientSecret:
          $env: KAGENTI_CLIENT_SECRET
        schedule:
          frequency: { minutes: 10 }
          timeout: { minutes: 5 }
  ```

#### Scenario: Helm chart values.yaml example (RHIDP-15266)

- **WHEN** a developer deploys via Helm
- **THEN** they can use the reference `values.yaml`:

  ```yaml
  global:
    dynamic:
      plugins:
        - package: '@boost/plugin-boost-backend-module-kagenti'
          disabled: false

  boost:
    extraVolumes:
      - name: custom-ca
        secret:
          secretName: custom-ca-bundle
    extraVolumeMounts:
      - name: custom-ca
        mountPath: /etc/ssl/certs/custom-ca.pem
        subPath: ca.crt
    extraEnvVars:
      - name: NODE_EXTRA_CA_CERTS
        value: /etc/ssl/certs/custom-ca.pem
      - name: KAGENTI_CLIENT_ID
        valueFrom:
          secretKeyRef:
            name: kagenti-creds
            key: client-id
      - name: KAGENTI_CLIENT_SECRET
        valueFrom:
          secretKeyRef:
            name: kagenti-creds
            key: client-secret
  ```

#### Scenario: Operator CR example (RHIDP-15266)

- **WHEN** a developer deploys via RHDH Operator
- **THEN** they can use the reference CR:
  ```yaml
  apiVersion: rhdh.redhat.com/v1alpha1
  kind: Backstage
  metadata:
    name: rhdh-boost
  spec:
    application:
      dynamicPluginsConfigMapName: dynamic-plugins
      extraEnvs:
        envs:
          - name: NODE_EXTRA_CA_CERTS
            value: /etc/ssl/certs/custom-ca.pem
          - name: KAGENTI_CLIENT_ID
            valueFrom:
              secretKeyRef:
                name: kagenti-creds
                key: client-id
          - name: KAGENTI_CLIENT_SECRET
            valueFrom:
              secretKeyRef:
                name: kagenti-creds
                key: client-secret
      extraVolumes:
        - name: custom-ca
          secret:
            secretName: custom-ca-bundle
      extraVolumeMounts:
        - name: custom-ca
          mountPath: /etc/ssl/certs/custom-ca.pem
          subPath: ca.crt
  ```

#### Scenario: Pattern is generic and reusable (RHIDP-15266)

- **WHEN** a new connector Feature is implemented (e.g., OCI skill registry)
- **THEN** it follows the same air-gapped configuration pattern: `$env` credentials (backed by mounted K8s Secrets), `caCertPath`, `baseUrl`
- **AND** the reference configuration is documented as a generic "AI Catalog connector configuration" pattern for all connectors
