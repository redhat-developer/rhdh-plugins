# SkillBundle Node Creation and INCLUDES Relationship Support

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

SkillBundle entities represent curated collections of related skills (e.g., "security-toolkit" bundle containing skills for secret scanning, vulnerability analysis, SBOM generation). The adapter creates SkillBundle nodes and INCLUDES relationships connecting bundles to individual skills.

## ADDED Requirements

### Requirement: SkillBundle Node Creation from Catalog Entity

SkillBundle entities are synced to SkillBundle nodes with properties mirroring bundle metadata.

#### Scenario: SkillBundle entity synced to SkillBundle node

- **WHEN** a SkillBundle entity (AIResource kind with `spec.type: 'ai-skill-bundle'` and `rhdh.io/ai-asset-category: skill-bundle`) is synced
- **THEN** the adapter creates or updates a `SkillBundle` node with properties:
  - `entityUid`: `metadata.uid`
  - `name`: `metadata.name`
  - `namespace`: `metadata.namespace`
  - `version`: `metadata.annotations['rhdh.io/ai-asset-version']`
  - `description`: `metadata.description`
  - `category`: `metadata.annotations['rhdh.io/ai-asset-category']`
  - `_syncedRevision`: `metadata.resourceVersion` or `metadata.etag`

#### Scenario: SkillBundle with domain tag creates BELONGS_TO relationship

- **WHEN** a SkillBundle entity has `metadata.tags: ['domain:security']`
- **THEN** the adapter ensures a `Domain` node exists with `name: 'security'`
- **AND** creates a relationship `(bundle)-[:BELONGS_TO]->(domain)`

### Requirement: INCLUDES Relationship from Bundle Skill References

SkillBundle-to-skill relationships are derived from the bundle's skill list.

#### Scenario: SkillBundle with skill references creates INCLUDES relationships

- **WHEN** a SkillBundle entity has:
  ```yaml
  spec:
    skills:
      - airesource:default/skill-secret-scanner
      - airesource:default/skill-sbom-generator
      - airesource:default/skill-vuln-analyzer
  ```
- **THEN** the adapter creates relationships:
  - `(bundle)-[:INCLUDES]->(skill1)` where `skill1.entityUid = 'airesource:default/skill-secret-scanner'`
  - `(bundle)-[:INCLUDES]->(skill2)` where `skill2.entityUid = 'airesource:default/skill-sbom-generator'`
  - `(bundle)-[:INCLUDES]->(skill3)` where `skill3.entityUid = 'airesource:default/skill-vuln-analyzer'`
- **AND** if a referenced skill is not yet in the graph, the relationship is deferred until the skill is synced

#### Scenario: Skill reference removed from bundle deletes INCLUDES relationship

- **WHEN** a SkillBundle entity's `spec.skills` no longer includes a previously-present skill reference
- **THEN** the adapter deletes the corresponding `INCLUDES` relationship
- **AND** does not delete the Skill node (other bundles or agents may reference it)

### Requirement: SkillBundle Update Propagation

Bundle definitions can be updated through incremental sync without affecting included skills.

#### Scenario: SkillBundle description updated

- **WHEN** a SkillBundle entity's `metadata.description` changes
- **THEN** the adapter updates the `description` property on the SkillBundle node
- **AND** does not modify `INCLUDES` relationships unless `spec.skills` changed
- **AND** updates `_syncedRevision` to the new revision

#### Scenario: SkillBundle version updated creates new node

- **WHEN** a SkillBundle entity's `metadata.annotations['rhdh.io/ai-asset-version']` changes from `1.0.0` to `1.1.0`
- **THEN** the adapter treats this as a new bundle version:
  - Updates the existing SkillBundle node's `version` property to `1.1.0`
  - OR creates a new SkillBundle node if versioning strategy requires separate nodes per version (design decision: single node with version property vs. multiple versioned nodes — TBD during implementation)

### Requirement: SkillBundle Deletion Cleanup

Deleting a SkillBundle removes the node and relationships without affecting included skills.

#### Scenario: Deleted SkillBundle removes node and INCLUDES relationships

- **WHEN** a SkillBundle entity is deleted from the catalog
- **THEN** the adapter deletes the SkillBundle node
- **AND** Neo4j automatically deletes all attached `INCLUDES` relationships (Cypher: `DETACH DELETE`)
- **AND** does NOT delete the Skill nodes that were included in the bundle

#### Scenario: Orphaned skills remain in graph

- **WHEN** the last SkillBundle including a specific skill is deleted
- **THEN** the Skill node remains in the graph (it may still be referenced by agents, other bundles, or used directly)
- **AND** the skill is still discoverable via domain, tag-based queries, or dependency traversal

### Requirement: Bundle Composition Queries

Example Cypher queries demonstrate how to traverse INCLUDES relationships.

#### Scenario: Find all skills in a bundle

- **WHEN** a user queries for skills in the "security-toolkit" bundle
- **THEN** the following Cypher query returns all included skills:
  ```cypher
  MATCH (bundle:SkillBundle {name: 'security-toolkit'})-[:INCLUDES]->(skill:Skill)
  RETURN skill.name, skill.description, skill.version
  ORDER BY skill.name;
  ```

#### Scenario: Find all bundles containing a specific skill

- **WHEN** a user queries for bundles containing the "secret-scanner" skill
- **THEN** the following Cypher query returns all bundles:
  ```cypher
  MATCH (bundle:SkillBundle)-[:INCLUDES]->(skill:Skill {name: 'secret-scanner'})
  RETURN bundle.name, bundle.description, bundle.version
  ORDER BY bundle.name;
  ```

#### Scenario: Find skills common to two bundles

- **WHEN** a user queries for skills shared between "security-toolkit" and "compliance-toolkit" bundles
- **THEN** the following Cypher query returns the intersection:
  ```cypher
  MATCH (bundle1:SkillBundle {name: 'security-toolkit'})-[:INCLUDES]->(skill:Skill)<-[:INCLUDES]-(bundle2:SkillBundle {name: 'compliance-toolkit'})
  RETURN skill.name, skill.description
  ORDER BY skill.name;
  ```

#### Scenario: Find transitive dependencies of all skills in a bundle

- **WHEN** a user queries for all dependencies (direct and transitive) of skills in the "security-toolkit" bundle
- **THEN** the following Cypher query returns the dependency tree:
  ```cypher
  MATCH (bundle:SkillBundle {name: 'security-toolkit'})-[:INCLUDES]->(skill:Skill)
  OPTIONAL MATCH path = (skill)-[:DEPENDS_ON*]->(dep:Skill)
  RETURN skill.name AS skill, collect(DISTINCT dep.name) AS dependencies
  ORDER BY skill.name;
  ```

### Requirement: SkillBundle Metadata Validation

The adapter validates SkillBundle entity structure before syncing.

#### Scenario: Invalid skill reference is logged and skipped

- **WHEN** a SkillBundle entity has `spec.skills: ['invalid-reference']` (not a valid entity reference format)
- **THEN** the adapter logs a warning: "SkillBundle {bundle.name}: Invalid skill reference 'invalid-reference', expected format 'airesource:{namespace}/{name}'"
- **AND** skips creating the `INCLUDES` relationship for that reference
- **AND** still syncs the SkillBundle node and valid relationships

#### Scenario: Missing spec.skills field creates bundle node without INCLUDES relationships

- **WHEN** a SkillBundle entity has no `spec.skills` field or an empty array
- **THEN** the adapter creates the SkillBundle node
- **AND** does not create any `INCLUDES` relationships
- **AND** logs a warning: "SkillBundle {bundle.name}: No skills defined in spec.skills"
