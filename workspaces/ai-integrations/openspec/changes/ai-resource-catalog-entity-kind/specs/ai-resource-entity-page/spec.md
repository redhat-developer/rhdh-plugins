## ADDED Requirements

### Requirement: AIResource entity detail page rendered via standard catalog layout

The system SHALL render a detail page for AIResource entities using the existing Backstage catalog `EntityPage` layout.

#### Scenario: Entity detail page loads for AIResource kind

- **WHEN** a user navigates to the catalog URL of an AIResource entity
- **THEN** the standard entity detail page renders with the entity metadata visible

#### Scenario: Entity page displays for both git/HTTPS and OCI sourced entities

- **WHEN** an AIResource entity has a git/HTTPS or OCI `backstage.io/source-location`
- **THEN** the same entity page layout renders for both and the location display adapts to the source type

---

### Requirement: Asset location rendered from `backstage.io/source-location`

The entity detail page SHALL display the asset location from `backstage.io/source-location` as either a clickable link for git/HTTPS sources or copyable text for OCI sources.

#### Scenario: Git/HTTPS location displayed as clickable link

- **WHEN** an AIResource entity has `backstage.io/source-location: url:https://…`
- **THEN** the entity page shows the URL as a clickable link

#### Scenario: OCI location displayed as copyable text

- **WHEN** an AIResource entity has `backstage.io/source-location: url:oci://…`
- **THEN** the entity page displays the OCI URI as copyable text with a copy-to-clipboard affordance (not as a normal browser navigation link)

#### Scenario: Location label indicates source type

- **WHEN** the entity page renders the asset location
- **THEN** the display indicates whether the source is a git/HTTPS URL or an OCI image reference

---

### Requirement: Relationships graph displayed via standard catalog graph viewer

The entity detail page SHALL include the standard catalog relationships graph showing any declared relations between the AIResource entity and other catalog entities.

#### Scenario: Graph card rendered on entity page

- **WHEN** a user views an AIResource entity detail page
- **THEN** the relationships graph card is present

#### Scenario: Graph empty when no relations declared

- **WHEN** an AIResource entity declares no relations
- **THEN** the graph card renders an empty graph rather than disappearing from the page

---

### Requirement: TechDocs displayed when `techdocs-ref` annotation is present

If an AIResource entity declares `metadata.annotations["backstage.io/techdocs-ref"]`, the entity detail page SHALL include a TechDocs tab that renders the referenced documentation.

#### Scenario: TechDocs tab present when annotation is set

- **WHEN** an AIResource entity declares `backstage.io/techdocs-ref`
- **THEN** the entity page includes a Docs tab and renders the TechDocs content

#### Scenario: TechDocs tab absent when annotation is not set

- **WHEN** an AIResource entity does not declare `backstage.io/techdocs-ref`
- **THEN** no Docs tab is shown
