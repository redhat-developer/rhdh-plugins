# Conditional Policies

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Three custom permission rules enable RBAC policy scoping to asset category, source connector, and tenant identity. Each rule inspects entity annotations and implements `toQuery()` for database-level filtering on list endpoints.

**Jira references:** RHIDP-15270, RHIDP-15312

## ADDED Requirements

### Requirement: isAiAssetCategory Rule

A conditional rule MUST filter AI assets by their category annotation.

#### Scenario: Category-scoped visibility

- **WHEN** a deployer configures an RBAC policy with `isAiAssetCategory({ category: 'ai-model' })`
- **THEN** the rule's `apply(resource, params)` returns `true` only when the resource's `rhdh.io/ai-asset-category` annotation matches `'ai-model'`
- **AND** the rule's `toQuery({ category: 'ai-model' })` generates a catalog query predicate filtering by the annotation value
- **AND** the rule works with both ALLOW and DENY policies

#### Scenario: Multiple categories via anyOf

- **WHEN** a deployer wants to grant access to both `ai-model` and `agent` categories
- **THEN** they configure two rules composed with `anyOf`:
  ```
  anyOf:
    - isAiAssetCategory({ category: 'ai-model' })
    - isAiAssetCategory({ category: 'agent' })
  ```
- **AND** the `toQuery()` implementation generates an OR clause

### Requirement: isFromConnector Rule

A conditional rule MUST filter AI assets by their source connector.

#### Scenario: Connector-scoped visibility

- **WHEN** a deployer configures an RBAC policy with `isFromConnector({ connector: 'watsonx' })`
- **THEN** the rule's `apply(resource, params)` returns `true` only when the resource's `rhdh.io/ai-asset-source` annotation matches `'watsonx'`
- **AND** `toQuery()` generates a catalog query predicate filtering by the annotation value

#### Scenario: Deny access to specific connector

- **WHEN** a deployer wants to deny access to assets from a third-party connector
- **THEN** they configure a DENY policy with `isFromConnector({ connector: 'external-vendor' })`
- **AND** assets from that connector are excluded from list results and detail pages for affected users

### Requirement: isInTenant Rule

A conditional rule MUST filter AI assets by tenant identity for multi-tenant deployments.

#### Scenario: Tenant-scoped visibility

- **WHEN** a deployer configures an RBAC policy with `isInTenant({ tenant: 'team-alpha' })`
- **THEN** the rule's `apply(resource, params)` returns `true` only when the entity's namespace or tenant annotation matches `'team-alpha'`
- **AND** `toQuery()` generates a catalog query predicate filtering by namespace or annotation

#### Scenario: Default tenant for unscoped assets

- **WHEN** an AI asset has no explicit tenant annotation or namespace
- **THEN** it belongs to the `default` namespace
- **AND** `isInTenant({ tenant: 'default' })` matches it

### Requirement: Rule Registration

Custom rules MUST be registered with the permission framework at startup.

#### Scenario: Rule registration via permissionIntegrationRouter

- **WHEN** the AI Catalog backend module starts
- **THEN** the three rules are registered via `createPermissionIntegrationRouter` with `resourceType: 'ai-catalog-asset'`
- **AND** each rule has a unique `name` and `description` for RBAC admin UI display:
  | Rule Name | Description |
  |---|---|
  | `isAiAssetCategory` | Matches AI assets by their category (ai-model, agent, skill, mcp-server, model-server) |
  | `isFromConnector` | Matches AI assets by their source connector (e.g., watsonx, internal-registry) |
  | `isInTenant` | Matches AI assets by their tenant identity (namespace or annotation) |

### Requirement: Rule Composability

Rules MUST compose with standard Backstage permission criteria operators.

#### Scenario: allOf composition

- **WHEN** a deployer configures a policy requiring both category and connector match
- **THEN** they use `allOf`:
  ```
  allOf:
    - isAiAssetCategory({ category: 'ai-model' })
    - isFromConnector({ connector: 'watsonx' })
  ```
- **AND** the generated `toQuery()` produces an AND clause

#### Scenario: not composition

- **WHEN** a deployer wants to allow access to all categories except one
- **THEN** they configure `not: isAiAssetCategory({ category: 'internal-tool' })` on an ALLOW policy
- **AND** `toQuery()` produces a NOT clause wrapping the category filter
