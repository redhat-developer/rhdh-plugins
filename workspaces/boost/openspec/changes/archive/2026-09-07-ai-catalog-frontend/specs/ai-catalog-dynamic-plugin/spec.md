# AI Catalog Dynamic Plugin

> **Status: Implemented** — Frontend and OGX entity provider are in `rhdh-plugin-export-overlays` (`workspaces/boost`). Overlay CI runs `rhdh-cli plugin export`. A local `export-dynamic` script and `app-config.dynamic.yaml` in `plugins/boost` are not required.

Package the AI Catalog frontend plugin for RHDH dynamic plugin deployment via the overlays repo. Boost is NFS-only (`createFrontendPlugin` as default export) — no Scalprum, no `./alpha`, no legacy entry point.

Overlay registration and publication are owned by the external
[`rhdh-plugin-export-overlays`](https://github.com/redhat-developer/rhdh-plugin-export-overlays)
repository. They are release evidence, not behavior validated by this
workspace's tests.

## ADDED Requirements

### Requirement: Dynamic Plugin Package

The frontend package MUST remain compatible with RHDH dynamic-plugin export
tooling.

#### Scenario: Package has no local dynamic-export output

- **GIVEN** `plugins/boost/package.json`
- **THEN** its scripts do not define `export-dynamic`
- **AND** its published `files` do not include `dist-dynamic/`

### Requirement: Plugin Loads in RHDH

The OCI-packaged plugin MUST load correctly in an RHDH deployment.

#### Scenario: Plugin loads with Module Federation

- **GIVEN** an RHDH deployment with `ENABLE_STANDARD_MODULE_FEDERATION=true`
- **AND** the boost frontend dynamic plugin is installed via `dynamic-plugins.yaml` with `enabled: true`
- **WHEN** a user navigates to the RHDH instance
- **THEN** the "AI Catalog" nav item appears in the sidebar
- **AND** navigating to `/ai-catalog` renders the browse page

#### Scenario: Entity page extensions mount

- **GIVEN** the boost frontend dynamic plugin is installed
- **WHEN** a user navigates to a catalog entity page for an AI asset
- **THEN** the Summary, Adoption, and Version cards render when their required entity data exists
- **AND** the Usage tab (`entity-content:boost/usage`) is present on AI assets

#### Scenario: Extensions absent on non-AI entities

- **GIVEN** the boost frontend dynamic plugin is installed
- **WHEN** a user navigates to a catalog entity page for a non-AI entity (e.g., a regular Component)
- **THEN** no boost entity cards are rendered

### Requirement: Adopter Overrides

Deployers MUST be able to customize the plugin via `app.extensions` in `app-config.yaml`.

#### Scenario: Disable an entity card

- **GIVEN** the deployer sets `entity-card:boost/adoption: false` in `app.extensions`
- **WHEN** a user views an AI asset entity page
- **THEN** the Download/Adopt Card is not rendered
- **AND** other boost cards still render

#### Scenario: Change entity filter on a card

- **GIVEN** the deployer sets `entity-card:boost/summary` with a `config.filter` that excludes AI asset kinds
- **WHEN** a user views an AiResource entity page
- **THEN** the summary card is not rendered (filter excludes AiResource)

#### Scenario: Disable the page

- **GIVEN** the deployer sets `page:boost/ai-catalog: false` in `app.extensions`
- **WHEN** a user views the RHDH sidebar
- **THEN** the "AI Catalog" nav item is not present
- **AND** navigating to `/ai-catalog` shows a 404 or redirects
