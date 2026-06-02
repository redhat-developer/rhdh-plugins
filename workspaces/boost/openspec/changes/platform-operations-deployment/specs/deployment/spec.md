# Plugin Deployment

Install and configure Augment in an RHDH or vanilla Backstage instance via two deployment paths.

## EXISTING Requirements

### Requirement: RHDH Dynamic Plugin Deployment

Deploy Augment as a dynamic plugin with zero code changes.

#### Scenario: Dynamic plugin installation

- **WHEN** the administrator configures `dynamic-plugins.override.yaml` with Augment OCI plugin references
- **THEN** RHDH loads frontend, backend, and common packages dynamically via Scalprum
- **AND** no code changes or application rebuilds are required
- **AND** Augment appears as a sidebar entry in RHDH

#### Scenario: Dynamic plugin configuration

- **WHEN** the administrator sets up `app-config.yaml` with Augment configuration
- **THEN** provider settings, security mode, and base URLs are configured
- **AND** the plugin validates configuration at startup against the declared schema

### Requirement: Backstage Static Plugin Deployment

Deploy Augment as a traditional Backstage plugin with npm packages.

#### Scenario: Static plugin installation

- **WHEN** the developer installs `@augment/plugin-augment`, `@augment/plugin-augment-backend`, and `@augment/plugin-augment-common`
- **THEN** frontend route, sidebar entry, icon, and backend plugin are registered manually
- **AND** `app-config.yaml` is configured
- **AND** the application is rebuilt and deployed
