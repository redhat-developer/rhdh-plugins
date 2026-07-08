# Entity Page Extensions

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

NFS Blueprint extensions that render on existing catalog entity pages for AI assets. All extensions use the `isAiAsset` condition filter and do not render on non-AI entities.

## Requirements

### Requirement: AI Asset Summary Card

#### Scenario: Summary card renders on AI entity

- **WHEN** a developer views a catalog entity page for an AI asset
- **THEN** the AI Asset Summary Card shows the entity's category badge, current version, source connector attribution, and lifecycle state

#### Scenario: Summary card absent on non-AI entity

- **WHEN** a developer views a catalog entity page for a non-AI entity (e.g., a regular Component or API)
- **THEN** the AI Asset Summary Card is not rendered

### Requirement: Download/Adopt Card

#### Scenario: Git asset download

- **WHEN** the entity has `spec.location.type: git`
- **THEN** the card shows a Download button
- **AND** clicking the button triggers a ZIP download via the backend proxy
- **AND** a loading indicator is shown during download
- **AND** an error toast is shown on failure

#### Scenario: OCI asset pull command

- **WHEN** the entity has `spec.location.type: oci`
- **THEN** the card shows a docker/podman segmented toggle
- **AND** the pull command is displayed below the toggle using `spec.location.target`
- **AND** switching the toggle instantly updates the displayed command
- **AND** the Copy button copies the currently displayed command to clipboard

#### Scenario: No location type

- **WHEN** the entity does not have `spec.location.type`
- **THEN** the Download/Adopt Card is not rendered

### Requirement: Version List Card

#### Scenario: Version list with navigation

- **WHEN** the entity has multiple versions (linked by shared asset identifier)
- **THEN** the Version List Card shows all versions
- **AND** the current/recommended version is visually highlighted
- **AND** clicking a version navigates to that version's catalog entity page

### Requirement: Usage Tab

#### Scenario: TechDocs available

- **WHEN** the entity has the `backstage.io/techdocs-ref` annotation
- **THEN** the Usage tab renders TechDocs content for the entity

#### Scenario: TechDocs not available

- **WHEN** the entity does not have the TechDocs annotation
- **THEN** the Usage tab renders external links (source registry, repository, download location) from entity metadata

#### Scenario: RBAC gated — permission granted

- **WHEN** the user has the `ai-catalog.asset.read.usage-docs` permission (or the permission is not yet registered)
- **THEN** the Usage tab shows full usage content

#### Scenario: RBAC gated — permission denied

- **WHEN** the user has `ai-catalog.asset.read` but not `ai-catalog.asset.read.usage-docs`
- **THEN** the Usage tab shows a "Contact owner for access" affordance instead of usage content

#### Scenario: Tab visibility

- **WHEN** a developer views a non-AI entity page
- **THEN** the Usage tab is not present in the entity page tabs

### Requirement: Backend Download Proxy

#### Scenario: Successful download

- **WHEN** the frontend calls `GET /api/boost/catalog/download` with a valid entity ref
- **THEN** the backend resolves `spec.location.target`, authenticates to GitHub via Backstage SCM integrations, and streams the ZIP archive response

#### Scenario: Unauthorized download

- **WHEN** the user lacks catalog entity read permission for the requested entity
- **THEN** the backend returns 403

#### Scenario: Download failure

- **WHEN** the GitHub API is unreachable or returns an error
- **THEN** the backend returns an appropriate error status with a message
