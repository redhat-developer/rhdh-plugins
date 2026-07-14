# Relationship Mapping and Sync Adapter

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

The Neo4j sync adapter polls the Backstage catalog search API, identifies changed AI asset entities (skills, tools, domains, agents, model servers), creates graph nodes mirroring catalog metadata, and creates typed relationships derived from catalog data. The adapter implements the Neo4j sync adapter interface from the entity-provider SDK (RHIDP-15258, story RHIDP-15303).

## ADDED Requirements

### Requirement: Catalog API Polling with Incremental Sync

The adapter uses scheduled polling rather than real-time event subscription because the Backstage catalog does not provide a built-in secondary data store sync extension point (see RHDHPLAN-1507 feasibility report, Option A).

#### Scenario: Scheduled sync cycle processes only changed entities

- **WHEN** the scheduled task runs (default interval: 60 seconds, configurable via `aiCatalog.neo4j.syncInterval`)
- **THEN** the adapter queries the catalog search API with filter `metadata.annotations.rhdh.io/ai-asset-category: *`
- **AND** for each entity, compares `metadata.resourceVersion` (or `metadata.etag`) against the last-synced revision stored in Neo4j node property `_syncedRevision`
- **AND** only processes entities where `currentRevision !== lastSyncedRevision`
- **AND** after successful sync, updates the Neo4j node's `_syncedRevision` property to the current revision

#### Scenario: Full sync rebuilds graph from current catalog state

- **WHEN** the administrator triggers a full sync via API `/api/neo4j-sync/trigger-full-sync` or when Neo4j database is empty
- **THEN** the adapter processes ALL AI asset entities regardless of revision tracking
- **AND** creates or updates all nodes and relationships
- **AND** sets `_syncedRevision` for all nodes

#### Scenario: Deleted entities are removed from graph

- **WHEN** an entity previously synced to Neo4j no longer appears in catalog search results
- **THEN** the adapter deletes the corresponding Neo4j node and all attached relationships
- **AND** logs the deletion event

### Requirement: Graph Node Creation from Catalog Entity Metadata

Graph nodes mirror catalog entity metadata to enable graph queries without additional API calls.

#### Scenario: Skill entity synced to Skill node

- **WHEN** a skill entity is synced
- **THEN** the adapter creates or updates a `Skill` node with properties:
  - `entityUid`: `metadata.uid`
  - `name`: `metadata.name`
  - `namespace`: `metadata.namespace`
  - `version`: `metadata.annotations['rhdh.io/ai-asset-version']` or `spec.skillcard.version`
  - `description`: `metadata.description`
  - `category`: `metadata.annotations['rhdh.io/ai-asset-category']`
  - `tags`: `metadata.tags[]`
  - `_syncedRevision`: `metadata.resourceVersion` or `metadata.etag`

#### Scenario: Tool entity synced to Tool node

- **WHEN** a tool entity (Component kind with `spec.type: 'ai-tool'`) is synced
- **THEN** the adapter creates or updates a `Tool` node with properties:
  - `entityUid`, `name`, `namespace`, `description`, `_syncedRevision`
  - `toolType`: `spec.toolType` (e.g., "MCP", "CLI", "API")

#### Scenario: Domain entity synced to Domain node

- **WHEN** a domain entity is synced
- **THEN** the adapter creates or updates a `Domain` node with properties:
  - `entityUid`, `name`, `namespace`, `description`, `_syncedRevision`

#### Scenario: Agent entity synced to Agent node

- **WHEN** an agent entity (Component kind with `spec.type: 'ai-agent'`) is synced
- **THEN** the adapter creates or updates an `Agent` node with properties:
  - `entityUid`, `name`, `namespace`, `description`, `_syncedRevision`

#### Scenario: ModelServer entity synced to ModelServer node

- **WHEN** a model server entity (Resource kind with `spec.type: 'model-server'`) is synced
- **THEN** the adapter creates or updates a `ModelServer` node with properties:
  - `entityUid`, `name`, `namespace`, `modelType`, `_syncedRevision`
  - `modelType`: `spec.modelType` (e.g., "openai", "anthropic", "vertex-ai")

### Requirement: DEPENDS_ON Relationship from Version Dependencies

Skill-to-skill dependencies are derived from `skillcard.yaml` metadata.

#### Scenario: Skill with version dependencies creates DEPENDS_ON relationships

- **WHEN** a skill entity has `spec.skillcard.dependencies: [{name: 'http-client', versionConstraint: '^1.0.0'}]`
- **THEN** the adapter creates a relationship `(skill)-[:DEPENDS_ON {versionConstraint: '^1.0.0'}]->(dependencySkill)` where `dependencySkill.name = 'http-client'`
- **AND** if the dependency skill is not yet in the graph, the relationship is deferred until the dependency is synced

#### Scenario: Dependency removed from skillcard deletes DEPENDS_ON relationship

- **WHEN** a skill entity's `spec.skillcard.dependencies` no longer includes a previously-present dependency
- **THEN** the adapter deletes the corresponding `DEPENDS_ON` relationship
- **AND** does not delete the dependency Skill node (other skills may still depend on it)

### Requirement: USES_TOOL Relationship from Allowed Tools

Skill-to-tool relationships are derived from `skillcard.yaml` allowed tools.

#### Scenario: Skill with allowed tools creates USES_TOOL relationships

- **WHEN** a skill entity has `spec.skillcard.allowedTools: ['github', 'jira']`
- **THEN** the adapter creates relationships `(skill)-[:USES_TOOL]->(toolGithub)` and `(skill)-[:USES_TOOL]->(toolJira)` where tools match by name
- **AND** if a tool is not yet in the graph, the relationship is deferred until the tool is synced

#### Scenario: Tool removed from allowed tools deletes USES_TOOL relationship

- **WHEN** a skill entity's `spec.skillcard.allowedTools` no longer includes a previously-allowed tool
- **THEN** the adapter deletes the corresponding `USES_TOOL` relationship
- **AND** does not delete the Tool node

### Requirement: BELONGS_TO Relationship from Domain Tags and Annotations

Skill/Agent-to-domain relationships are derived from tags and annotations.

#### Scenario: Skill with domain tag creates BELONGS_TO relationship

- **WHEN** a skill entity has `metadata.tags: ['domain:security']`
- **THEN** the adapter ensures a `Domain` node exists with `name: 'security'`
- **AND** creates a relationship `(skill)-[:BELONGS_TO]->(domain)`

#### Scenario: Skill with ai-asset-category annotation creates BELONGS_TO relationship

- **WHEN** a skill entity has `metadata.annotations['rhdh.io/ai-asset-category']: 'devops'`
- **THEN** the adapter ensures a `Domain` node exists with `name: 'devops'`
- **AND** creates a relationship `(skill)-[:BELONGS_TO]->(domain)`

#### Scenario: Domain tag removed deletes BELONGS_TO relationship

- **WHEN** a skill entity's tags no longer include a `domain:*` tag
- **THEN** the adapter deletes the corresponding `BELONGS_TO` relationship
- **AND** does not delete the Domain node (other skills may belong to it)

### Requirement: SIMILAR_TO Relationship from Tag Overlap

Skill-to-skill similarity is computed from tag overlap using Jaccard similarity.

#### Scenario: Skills with overlapping tags create SIMILAR_TO relationships

- **WHEN** skill A has `tags: ['kubernetes', 'deployment', 'ci-cd']` and skill B has `tags: ['kubernetes', 'helm', 'ci-cd']`
- **THEN** the adapter computes Jaccard similarity = |{kubernetes, ci-cd}| / |{kubernetes, deployment, ci-cd, helm}| = 2 / 4 = 0.5
- **AND** because 0.5 > 0.3 (default threshold, configurable via `aiCatalog.neo4j.similarityThreshold`), creates relationship `(skillA)-[:SIMILAR_TO {similarity: 0.5}]->(skillB)`

#### Scenario: Similarity computation is skipped if disabled

- **WHEN** configuration `aiCatalog.neo4j.computeSimilarity: false`
- **THEN** the adapter does not compute or create `SIMILAR_TO` relationships
- **AND** existing `SIMILAR_TO` relationships are not deleted (allow manual curation)

#### Scenario: Skill tags change recomputes SIMILAR_TO relationships

- **WHEN** a skill's tags are updated during sync
- **THEN** the adapter deletes all outgoing `SIMILAR_TO` relationships from that skill
- **AND** recomputes similarity against all other skills
- **AND** creates new `SIMILAR_TO` relationships where similarity > threshold

### Requirement: IMPLEMENTED_BY Relationship from Catalog Entity Relations

Agent-to-skill relationships are derived from catalog `spec.dependsOn` relations.

#### Scenario: Agent depends on skill creates IMPLEMENTED_BY relationship

- **WHEN** an agent entity has `spec.dependsOn: ['component:default/skill-jira-triage']`
- **THEN** the adapter creates a relationship `(agent)-[:IMPLEMENTED_BY]->(skill)` where `skill.entityUid = 'component:default/skill-jira-triage'`

#### Scenario: Agent no longer depends on skill deletes IMPLEMENTED_BY relationship

- **WHEN** an agent entity's `spec.dependsOn` no longer includes a skill reference
- **THEN** the adapter deletes the corresponding `IMPLEMENTED_BY` relationship

### Requirement: Sync Failure Isolation

Sync failures for individual entities do not abort the remaining sync cycle.

#### Scenario: Single entity sync failure is logged and skipped

- **WHEN** syncing an entity throws an error (e.g., malformed skillcard, Neo4j write failure)
- **THEN** the adapter logs the error with entity UID and stack trace
- **AND** continues processing the next entity
- **AND** does NOT update `_syncedRevision` for the failed entity (will retry on next cycle)

#### Scenario: Sync cycle reports summary metrics

- **WHEN** a sync cycle completes
- **THEN** the adapter logs summary: total entities queried, entities synced successfully, entities skipped (unchanged), entities failed
- **AND** emits metrics to monitoring system (Prometheus format): `neo4j_sync_total`, `neo4j_sync_success`, `neo4j_sync_failures`

### Requirement: Neo4j Sync Adapter Interface Implementation

The adapter implements the interface defined in the entity-provider SDK (RHIDP-15258, story RHIDP-15303).

#### Scenario: Adapter exports standard lifecycle hooks

- **WHEN** the adapter is installed as a Backstage backend plugin
- **THEN** it exports `createNeo4jSyncAdapter(env: PluginEnvironment): Neo4jSyncAdapter` factory function
- **AND** the adapter implements:
  - `connect(): Promise<void>` — establishes Neo4j driver connection
  - `disconnect(): Promise<void>` — closes Neo4j driver
  - `startSync(): void` — starts scheduled sync task
  - `stopSync(): void` — stops scheduled sync task
  - `triggerFullSync(): Promise<SyncReport>` — triggers one-time full sync, returns summary

#### Scenario: Adapter configuration via app-config

- **WHEN** the adapter is configured in `app-config.yaml`:
  ```yaml
  aiCatalog:
    neo4j:
      uri: bolt://neo4j.example.com:7687
      auth:
        username: neo4j
        password: ${NEO4J_PASSWORD}
      syncInterval: 60
      similarityThreshold: 0.3
      computeSimilarity: true
  ```
- **THEN** the adapter reads configuration from `config.getConfig('aiCatalog.neo4j')`
- **AND** validates required fields (`uri`, `auth.username`, `auth.password`)
- **AND** uses defaults for optional fields (`syncInterval: 60`, `similarityThreshold: 0.3`, `computeSimilarity: true`)
