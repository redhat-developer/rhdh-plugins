# Plugin Deployment

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

Install and configure Boost in an RHDH or vanilla Backstage instance via two deployment paths.

## EXISTING Requirements

### Requirement: RHDH Dynamic Plugin Deployment

Deploy Boost as a dynamic plugin with zero code changes.

#### Scenario: Dynamic plugin installation

- **WHEN** the administrator configures `dynamic-plugins.override.yaml` with Boost OCI plugin references
- **THEN** RHDH loads frontend, backend, and common packages dynamically via Scalprum
- **AND** no code changes or application rebuilds are required
- **AND** Boost appears as a sidebar entry in RHDH

#### Scenario: Dynamic plugin configuration

- **WHEN** the administrator sets up `app-config.yaml` with Boost configuration
- **THEN** provider settings, security mode, and base URLs are configured
- **AND** the plugin validates configuration at startup against the declared schema

### Requirement: Backstage Static Plugin Deployment

Deploy Boost as a traditional Backstage plugin with npm packages.

#### Scenario: Static plugin installation

- **WHEN** the developer installs `@boost/plugin-boost`, `@boost/plugin-boost-backend`, `@boost/plugin-boost-common`, and `@boost/plugin-boost-node`
- **THEN** frontend route, sidebar entry, icon, and backend plugin are registered manually
- **AND** `app-config.yaml` is configured
- **AND** the application is rebuilt and deployed

## ADDED Requirements

### Requirement: Specification Coverage

This capability area MUST have its existing behavior documented as baseline acceptance criteria.

#### Scenario: Baseline validation

- **WHEN** the existing implementation is validated against this specification
- **THEN** all scenarios described in the EXISTING Requirements section MUST pass
