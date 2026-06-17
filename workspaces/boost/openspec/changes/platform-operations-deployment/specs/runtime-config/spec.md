# Runtime Configuration Engine

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Change Boost's behavior at runtime — model, system prompt, tools, caps, and more — without restarting.

## EXISTING Requirements

### Requirement: Two-Layer Configuration Resolution

YAML baseline + database overrides with automatic fallback.

#### Scenario: Config resolution precedence

- **WHEN** a runtime config value is requested
- **THEN** `RuntimeConfigResolver` checks `AdminConfigService` (DB) first
- **AND** if a DB override exists, it takes precedence over the YAML baseline
- **AND** if no DB override exists, the YAML baseline value is used
- **AND** resolved values are cached with 30-second TTL

#### Scenario: Config write invalidation

- **WHEN** an admin writes a config value via the admin panel
- **THEN** `AdminConfigService` persists it to the `boost_admin_config` table
- **AND** the `RuntimeConfigResolver` cache is immediately invalidated
- **AND** the new value takes effect within seconds (not waiting for TTL expiry)

#### Scenario: DB override removed restores YAML baseline

- **WHEN** a DB override is removed via the admin panel
- **THEN** the YAML baseline value is restored as the effective value

### Requirement: Configurable Categories

25+ runtime-configurable keys across multiple categories.

#### Scenario: Model connection configuration

- **WHEN** the admin opens the Model Connection panel
- **THEN** base URL, model name, and connection test are configurable
- **AND** changes take effect without restart

#### Scenario: System prompt configuration

- **WHEN** the admin edits the system prompt
- **THEN** they can edit directly or use LLM-assisted prompt generation via `GeneratePromptForm`
- **AND** the updated prompt applies to subsequent conversations

#### Scenario: Agent-level configuration

- **WHEN** the admin configures a specific agent
- **THEN** per-agent model, temperature, max tokens, tool choice, MCP server subsets, and vector store IDs are configurable

### Requirement: Admin Onboarding

First-time administrators receive guided setup.

#### Scenario: Admin onboarding card on first visit

- **WHEN** an admin visits the admin panel for the first time
- **THEN** `AdminOnboardingCard` provides guided setup steps
- **AND** each step links to the relevant configuration panel

## MODIFIED Requirements

### Requirement: Schema-Driven Config Validation

Hand-written validators MUST be replaced with schema-derived validation.

#### Scenario: Validation from single source of truth

- **WHEN** a config value is written via the admin panel
- **THEN** it is validated using a schema derived from the same source as `config.d.ts` (Zod or JSON Schema)
- **AND** the 668-line `configValidation.ts` hand-written validators are eliminated
- **AND** DB-stored values cannot bypass the same constraints that YAML values must satisfy

#### Scenario: YAML-only vs DB-overridable documentation

- **WHEN** a deployer reviews the config schema
- **THEN** each field is documented as YAML-only, DB-overridable, or DB-only
- **AND** the admin UI only shows DB-overridable fields

### Requirement: New Config Categories

The following new features MUST have runtime configuration fields as specified below.

#### Scenario: Agent approval configuration

- **WHEN** the admin configures agent approval settings
- **THEN** the following fields are available:
  | Field | Scope | Description |
  |---|---|---|
  | `boost.agentApproval.mode` | db-overridable | Built-in or SonataFlow-managed approval |
  | `boost.agentApproval.sonataflow.endpoint` | yaml-only | SonataFlow workflow endpoint |

#### Scenario: Skills marketplace configuration

- **WHEN** the admin configures skills marketplace
- **THEN** the following fields are available:
  | Field | Scope | Description |
  |---|---|---|
  | `boost.skillsMarketplace.endpoint` | yaml-only | Skills catalog backend URL |
  | `boost.skillsMarketplace.enabled` | db-overridable | Enable/disable skills marketplace |

#### Scenario: Token exchange configuration

- **WHEN** the admin configures per-user Kagenti auth
- **THEN** the following fields are available:
  | Field | Scope | Description |
  |---|---|---|
  | `boost.kagenti.auth.tokenExchange.enabled` | yaml-only | Enable RFC 8693 token exchange |
  | `boost.kagenti.auth.tokenExchange.audience` | yaml-only | Target audience for exchanged token |
  | `boost.kagenti.auth.tokenExchange.userTokenHeader` | yaml-only | Header containing user OIDC token |

#### Scenario: Credential encryption

- **WHEN** sensitive credentials (DevSpaces tokens) are stored
- **THEN** they are encrypted at rest in the `boost_admin_config` table
- **AND** the admin UI masks credential values

### Requirement: Config Schema Versioning

DB-stored config values MUST survive schema changes across upgrades.

#### Scenario: Schema evolution on startup

- **WHEN** boost starts and the Zod schema has changed since the last run
- **THEN** a startup validation checks all existing DB values against the current schema
- **AND** values that pass validation are kept as-is
- **AND** values that fail validation are logged with details (field, stored value, validation error)
- **AND** failed values are removed from the DB override, restoring the YAML baseline for those fields
- **AND** the admin is notified of removed overrides via the admin onboarding/status panel

#### Scenario: Schema version tracking

- **WHEN** boost writes a config value to the DB
- **THEN** the schema version is stored alongside the value
- **AND** on startup, values from older schema versions are re-validated against the current schema
