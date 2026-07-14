# Tasks: Neo4j Knowledge Graph Sync Adapter

## 1. Core Sync Adapter Implementation (P0)

- [ ] 1.1 Create backend plugin package structure at `workspaces/boost/plugins/catalog-backend-module-neo4j-sync/` (RHIDP-15299)
- [ ] 1.2 Implement Neo4j driver factory with configuration loading from `aiCatalog.neo4j` (RHIDP-15299)
- [ ] 1.3 Implement catalog API polling with entity filtering (`metadata.annotations.rhdh.io/ai-asset-category`) (RHIDP-15299)
- [ ] 1.4 Implement entity revision tracking using `_syncedRevision` node property (RHIDP-15299)
- [ ] 1.5 Implement incremental sync logic (only process changed entities) (RHIDP-15299)
- [ ] 1.6 Implement scheduled sync task with configurable interval (RHIDP-15299)
- [ ] 1.7 Implement sync failure isolation (log and skip failed entities) (RHIDP-15299)
- [ ] 1.8 Implement full sync trigger API endpoint `/api/neo4j-sync/trigger-full-sync` (RHIDP-15299)

## 2. Graph Node Creation (P0)

- [ ] 2.1 Implement Skill node creation with properties from catalog entity metadata (RHIDP-15299)
- [ ] 2.2 Implement Tool node creation with `toolType` property (RHIDP-15299)
- [ ] 2.3 Implement Domain node creation (RHIDP-15299)
- [ ] 2.4 Implement Agent node creation (RHIDP-15299)
- [ ] 2.5 Implement ModelServer node creation with `modelType` property (RHIDP-15299)
- [ ] 2.6 Implement node update logic (update properties on revision change) (RHIDP-15299)
- [ ] 2.7 Implement node deletion logic (entity no longer in catalog) (RHIDP-15299)

## 3. Relationship Type Mapping (P0)

- [ ] 3.1 Implement DEPENDS_ON relationship creation from `spec.skillcard.dependencies` (RHIDP-15299)
- [ ] 3.2 Implement USES_TOOL relationship creation from `spec.skillcard.allowedTools` (RHIDP-15299)
- [ ] 3.3 Implement BELONGS_TO relationship creation from `metadata.tags` and `rhdh.io/ai-asset-category` (RHIDP-15299)
- [ ] 3.4 Implement SIMILAR_TO relationship creation with Jaccard similarity computation (RHIDP-15299)
- [ ] 3.5 Implement IMPLEMENTED_BY relationship creation from catalog entity relations (RHIDP-15299)
- [ ] 3.6 Implement relationship deletion logic (when relationship no longer applies) (RHIDP-15299)
- [ ] 3.7 Implement deferred relationship creation (when target node not yet synced) (RHIDP-15299)

## 4. SkillBundle Support (P0)

- [ ] 4.1 Implement SkillBundle node creation with properties (RHIDP-15300)
- [ ] 4.2 Implement INCLUDES relationship creation from `spec.skills` list (RHIDP-15300)
- [ ] 4.3 Implement SkillBundle update propagation (description, version changes) (RHIDP-15300)
- [ ] 4.4 Implement SkillBundle deletion cleanup (remove node and relationships) (RHIDP-15300)
- [ ] 4.5 Implement SkillBundle metadata validation (invalid skill references) (RHIDP-15300)
- [ ] 4.6 Add bundle composition example queries to `examples/neo4j-queries.cypher` (RHIDP-15300)

## 5. Entity Provider SDK Interface Implementation (P0)

- [ ] 5.1 Implement `createNeo4jSyncAdapter()` factory function (RHIDP-15299)
- [ ] 5.2 Implement `connect()` lifecycle hook (RHIDP-15299)
- [ ] 5.3 Implement `disconnect()` lifecycle hook (RHIDP-15299)
- [ ] 5.4 Implement `startSync()` method (RHIDP-15299)
- [ ] 5.5 Implement `stopSync()` method (RHIDP-15299)
- [ ] 5.6 Implement `triggerFullSync()` method with `SyncReport` return type (RHIDP-15299)
- [ ] 5.7 Validate configuration via `config.getConfig('aiCatalog.neo4j')` (RHIDP-15299)

## 6. Setup Documentation (P0)

- [ ] 6.1 Write `workspaces/boost/docs/neo4j-sync-setup.md` with configuration examples (RHIDP-15301)
- [ ] 6.2 Document K8s Secret setup for Neo4j credentials (RHIDP-15301)
- [ ] 6.3 Document manual sync trigger API usage (RHIDP-15301)
- [ ] 6.4 Write `workspaces/boost/docs/neo4j-graph-schema.md` with node/relationship type tables (RHIDP-15301)
- [ ] 6.5 Document catalog-as-source-of-truth architecture (RHIDP-15301)
- [ ] 6.6 Document relationship derivation rules (RHIDP-15301)
- [ ] 6.7 Write `workspaces/boost/examples/neo4j-queries.cypher` with 5+ example queries (RHIDP-15301)

## 7. Troubleshooting and Observability (P1)

- [ ] 7.1 Document sync failure troubleshooting steps (RHIDP-15301)
- [ ] 7.2 Document Neo4j connection troubleshooting (RHIDP-15301)
- [ ] 7.3 Document schema migration procedure (RHIDP-15301)
- [ ] 7.4 Implement Prometheus metrics export (`neo4j_sync_total`, `neo4j_sync_success`, etc.) (RHIDP-15301)
- [ ] 7.5 Document Prometheus metrics and example Grafana queries (RHIDP-15301)
- [ ] 7.6 Add structured logging for sync cycles (summary: entities processed/success/failed) (RHIDP-15301)

## 8. Testing and Validation (P1)

- [ ] 8.1 Write unit tests for entity revision tracking logic (RHIDP-15299)
- [ ] 8.2 Write unit tests for relationship derivation rules (RHIDP-15299)
- [ ] 8.3 Write integration tests with in-memory Neo4j (RHIDP-15299)
- [ ] 8.4 Write integration tests for SkillBundle INCLUDES relationships (RHIDP-15300)
- [ ] 8.5 Validate example Cypher queries against test graph (RHIDP-15301)
- [ ] 8.6 Test full sync rebuild from empty Neo4j database (RHIDP-15299)
- [ ] 8.7 Test sync failure isolation (single entity failure doesn't abort cycle) (RHIDP-15299)

## 9. Performance Optimization (P2)

- [ ] 9.1 Implement batching for Neo4j writes (create nodes in batches of 100) (RHIDP-15299)
- [ ] 9.2 Implement SIMILAR_TO computation throttling (only recompute on tag change) (RHIDP-15299)
- [ ] 9.3 Add similarity threshold configuration (`aiCatalog.neo4j.similarityThreshold`) (RHIDP-15299)
- [ ] 9.4 Add disable flag for SIMILAR_TO computation (`aiCatalog.neo4j.computeSimilarity`) (RHIDP-15299)
- [ ] 9.5 Profile sync cycle duration for large catalogs (>10k entities) (RHIDP-15299)
- [ ] 9.6 Document performance tuning in setup guide (RHIDP-15301)
