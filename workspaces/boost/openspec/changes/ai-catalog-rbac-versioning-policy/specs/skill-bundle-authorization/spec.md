> **Deferred:** This draft does not apply to the current AI Catalog baseline. Do not implement or promote these requirements until an approved Skills architecture defines bundle ownership, representation, serving, and bundle-level authorization. The archived Neo4j proposal is not that contract.

## ADDED Requirements

### Requirement: Bundle members are authorized at read time

When an approved future bundle-serving contract exists, RHDH SHALL authorize each SkillBundle member against its canonical Catalog entity with `catalog.entity.read` when bundle details are read, not when a bundle is created, stored, or indexed.

#### Scenario: Members are separate Catalog entities

- **WHEN** a SkillBundle references separate skill entities
- **THEN** each referenced skill is subject to `catalog.entity.read`
- **AND** unauthorized skills are absent from the authorized result

#### Scenario: Members are nested API data

- **WHEN** a backend returns skills nested inside a SkillBundle response
- **THEN** the backend resolves their canonical Catalog entity identifiers and removes unauthorized members before serialization
- **AND** omitted member identifiers, names, counts, and metadata are not leaked

#### Scenario: A future derived graph contains bundle relationships

- **WHEN** a derived Neo4j query returns `INCLUDES` relationships for a bundle
- **THEN** the backend does not treat graph membership as authorization
- **AND** it evaluates the referenced canonical Catalog entities before returning members

### Requirement: Mixed-access bundles remain usable

A bundle containing both authorized and unauthorized skills SHALL return the authorized subset without implying that the response is the complete stored bundle.

#### Scenario: Partial bundle visibility

- **WHEN** a user can read some but not all skills in a bundle
- **THEN** the response contains only authorized skills
- **AND** the UI renders only the returned members with an appropriate partial-visibility indication

#### Scenario: No visible members

- **WHEN** a user cannot read any skill in a bundle
- **THEN** the response does not reveal member details
- **AND** bundle visibility itself follows the authorization rule for the bundle representation

### Requirement: Bundle-level authorization requires an owning representation contract

No accepted current contract establishes Neo4j `SkillBundle` nodes, `INCLUDES` relationships, or canonical bundle-member identifiers. The archived Neo4j proposal is historical and does not establish those requirements. Before any future SkillBundle serving behavior is implemented, RHDHPLAN-1507 or the owning Skills architecture SHALL define bundle ownership, representation, serving API, and bundle-level authorization target.

#### Scenario: Bundle serving contract remains incomplete

- **WHEN** canonical member identifiers and graph relationships are available but the complete bundle ownership, serving, and authorization contract is not approved
- **THEN** member-authorization requirements remain valid
- **AND** bundle serving implementation remains blocked on the owning architecture contract
- **AND** direct Catalog entity authorization remains independently deliverable
