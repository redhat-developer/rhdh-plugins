## ADDED Requirements

### Requirement: AI Catalog management uses a global behavior permission

Boost common SHALL define and register `ai-catalog.manage` as a global basic permission with `attributes.action: update`.

#### Scenario: Management operation is authorized

- **WHEN** an AI Catalog operation is classified by its owning feature as a management operation
- **THEN** its backend authorization checks `ai-catalog.manage`, or `ai-catalog.admin` during the one-release compatibility period
- **AND** only `ai-catalog.manage` is accepted after that compatibility period ends
- **AND** the permission is evaluated globally rather than against an individual asset, category, or connector resource

#### Scenario: A future operation needs narrower scope

- **WHEN** a future feature requires connector-, category-, or resource-scoped management
- **THEN** that feature defines an appropriately scoped permission
- **AND** `ai-catalog.manage` does not automatically acquire the new authority

### Requirement: Published admin permission has a bounded compatibility period

Boost SHALL keep the published `ai-catalog.admin` permission registered and accepted for legitimate AI Catalog management operations for one compatibility release after `ai-catalog.manage` becomes canonical.

#### Scenario: Existing policy uses the deprecated permission

- **WHEN** a deployment grants `ai-catalog.admin` during the compatibility release
- **THEN** legitimate management operations accept that grant
- **AND** documentation identifies `ai-catalog.manage` as the replacement and states when compatibility ends

#### Scenario: Compatibility period ends

- **WHEN** the one-release compatibility period is complete
- **THEN** removal of `ai-catalog.admin` follows the normal breaking-change and migration process

### Requirement: Management permission does not grant entity visibility

Neither `ai-catalog.manage` nor `ai-catalog.admin` SHALL grant, imply, or bypass `catalog.entity.read`.

#### Scenario: Manager lacks entity-read permission

- **WHEN** a user has either management permission but is denied `catalog.entity.read` for an AI Catalog entity
- **THEN** the entity remains absent from authorized list, search, and direct-access responses
- **AND** an AI Catalog endpoint does not use management authorization as an entity-read fallback

### Requirement: RBAC policy management retains its existing permissions

Creating, updating, and deleting RBAC roles and policies SHALL continue to use the existing RHDH RBAC policy-management permissions.

#### Scenario: User can manage AI Catalog operations but not RBAC policy

- **WHEN** a user has `ai-catalog.manage` but lacks the required RBAC policy-management permission
- **THEN** the user cannot create, update, or delete RBAC roles or policies
