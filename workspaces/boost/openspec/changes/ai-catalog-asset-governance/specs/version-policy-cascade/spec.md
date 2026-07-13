# Version-Level Policy Cascade

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Asset-level RBAC policies propagate automatically to all version entities via the RBAC plugin's `RBACProvider` extension point. Version-specific overrides take precedence when configured.

**Jira references:** RHIDP-15274

## ADDED Requirements

### Requirement: RBACProvider-Based Policy Propagation

An `AICatalogRBACProvider` MUST implement the RBAC plugin's `RBACProvider` interface to propagate asset-level policies to version entities.

#### Scenario: Provider registration

- **WHEN** the AI Catalog backend module starts
- **THEN** an `AICatalogRBACProvider` is registered via `rbacProviderExtensionPoint`
- **AND** the provider implements `connect(connection)` and `refresh()` methods

#### Scenario: Asset-to-version policy propagation

- **WHEN** `refresh()` is called (on schedule or on catalog entity change event)
- **THEN** the provider queries the catalog for entities with `rhdh.io/ai-asset-version` annotation or `versionOf` relations
- **AND** for each asset entity with conditional permissions, those permissions are propagated to its version entities via `connection.applyConditionalPermissions()`
- **AND** the propagated permissions reference the version entity's `entityRef`, not the parent asset's

#### Scenario: Event-driven refresh

- **WHEN** a catalog entity is created, updated, or deleted
- **THEN** the catalog event bus notifies `AICatalogRBACProvider.refresh()`
- **AND** the provider re-evaluates only the affected asset→version relationships
- **AND** the provider debounces rapid successive events to avoid thundering herd on bulk ingestion

### Requirement: Version-Specific Overrides

Deployers MUST be able to override inherited policies for individual version entities.

#### Scenario: Version override takes precedence

- **WHEN** a deployer configures a version-specific policy via RBAC (e.g., DENY `ai-catalog.asset.read` for version `v2.0-beta`)
- **THEN** the version-specific policy takes precedence over the inherited asset-level policy
- **AND** the `policyDecisionPrecedence` config controls evaluation order (default: version-specific first)

#### Scenario: Override removal causes fallback

- **WHEN** a deployer removes a version-specific override
- **THEN** on the next `refresh()`, the version entity falls back to its parent asset's policy
- **AND** no manual re-application is required

### Requirement: Cascade Correctness

Policy cascade MUST correctly handle edge cases in asset-version relationships.

#### Scenario: Asset with no versions

- **WHEN** an asset entity has no associated version entities
- **THEN** the asset's own conditional permissions apply directly
- **AND** no cascade processing is performed for that asset

#### Scenario: Version entity without parent asset

- **WHEN** a version entity exists without a resolvable parent asset (orphan)
- **THEN** the version entity is evaluated with its own policies only (no inheritance)
- **AND** the provider logs a warning about the orphan entity

#### Scenario: Asset deletion cascades policy removal

- **WHEN** an asset entity is deleted from the catalog
- **THEN** on the next `refresh()`, the provider removes the propagated conditional permissions from all associated version entities
- **AND** version-specific overrides are retained (they were explicitly configured)
