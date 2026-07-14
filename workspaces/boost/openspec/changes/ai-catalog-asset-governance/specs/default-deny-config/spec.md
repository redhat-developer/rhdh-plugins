# Default-Deny Configuration

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Configurable default-deny posture for AI catalog assets. When enabled, newly ingested assets are invisible by default until explicit RBAC policies grant access. Per-category and per-connector scoping allows mixed posture within a single deployment.

**Jira references:** RHIDP-15270, RHIDP-15306

## ADDED Requirements

### Requirement: Default Policy Configuration

A configuration key MUST control the default visibility posture for newly ingested AI assets.

#### Scenario: Default-allow posture (Backstage standard)

- **WHEN** `ai-catalog.rbac.defaultPolicy` is set to `allow` (or not configured)
- **THEN** newly ingested AI assets are visible to all users with `ai-catalog.asset.read`
- **AND** no catch-all DENY rule is applied
- **AND** this matches standard Backstage behavior where permissions not explicitly denied are allowed

#### Scenario: Default-deny posture

- **WHEN** `ai-catalog.rbac.defaultPolicy` is set to `deny`
- **THEN** the `AICatalogRBACProvider` applies a catch-all DENY conditional rule for `ai-catalog.asset.read` on newly ingested entities
- **AND** deployers must explicitly grant access via RBAC policies (role-based or conditional) for users to see assets
- **AND** `ai-catalog.admin` holders can always see all assets regardless of default posture

#### Scenario: Only new assets affected

- **WHEN** the default policy is changed from `allow` to `deny`
- **THEN** only subsequently ingested assets receive the catch-all DENY rule
- **AND** existing assets retain their current visibility policies
- **AND** the ingestion-time boundary is tracked via the `rhdh.io/ai-catalog-ingested-at` annotation

### Requirement: Per-Category Default Posture

Deployers MUST be able to configure different default postures per asset category.

#### Scenario: Category-scoped deny configuration

- **WHEN** the configuration specifies per-category defaults:
  ```yaml
  ai-catalog:
    rbac:
      defaultPolicy: allow
      categories:
        ai-model:
          defaultPolicy: deny
        agents:
          defaultPolicy: allow
  ```
- **THEN** newly ingested assets with `rhdh.io/ai-asset-category: ai-model` receive a catch-all DENY rule
- **AND** newly ingested assets with `rhdh.io/ai-asset-category: agent` do not receive a deny rule
- **AND** categories not listed fall back to the top-level `defaultPolicy`

### Requirement: Per-Connector Default Posture

Deployers MUST be able to configure different default postures per source connector.

#### Scenario: Connector-scoped deny configuration

- **WHEN** the configuration specifies per-connector defaults:
  ```yaml
  ai-catalog:
    rbac:
      connectors:
        watsonx:
          defaultPolicy: deny
        internal-registry:
          defaultPolicy: allow
  ```
- **THEN** assets ingested from the `watsonx` connector receive a catch-all DENY rule
- **AND** assets ingested from `internal-registry` do not receive a deny rule
- **AND** connector identity is determined by the `rhdh.io/ai-asset-source` annotation

### Requirement: Configuration Validation

Invalid configuration MUST be rejected at startup with clear error messages.

#### Scenario: Invalid defaultPolicy value

- **WHEN** `ai-catalog.rbac.defaultPolicy` is set to an invalid value (not `allow` or `deny`)
- **THEN** the plugin fails to start with a clear error listing valid values
- **AND** the error follows the same pattern as `validateSecurityMode()` in boost's security middleware

#### Scenario: Unknown category or connector in config

- **WHEN** a per-category or per-connector config references a name that doesn't match any known asset
- **THEN** the plugin logs a warning at startup but does not fail
- **AND** the config is retained for future assets that may match
