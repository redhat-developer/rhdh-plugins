# Design: Neo4j Knowledge Graph Sync Adapter

## Context

The Backstage catalog stores AI asset metadata (skills, tools, domains, agents, model servers) as entities with annotations and spec fields. Relationships between assets are encoded in:

- `skillcard.yaml` metadata (dependencies, allowed-tools)
- Entity tags and annotations (domain/category)
- Catalog entity relations (dependsOn, uses)

Developers need to traverse these relationships to answer questions like "which skills depend on this tool?" or "find skills in the same domain." The catalog API doesn't expose graph traversal primitives.

Neo4j provides purpose-built graph queries, pattern matching (Cypher), and analytics. The sync adapter keeps Neo4j synchronized with the catalog as a derived read-only index.

**Feasibility constraint from RHDHPLAN-1507:** The Backstage catalog does NOT have a built-in "secondary data store sync" or "change notification" extension point. Three options analyzed:

- **Option A — Catalog API Polling (RECOMMENDED):** Scheduled task diffs catalog state against Neo4j, applies changes. Clean separation, uses stable APIs. Polling latency is acceptable (30-60s).
- **Option B — Custom Processor Side Effect:** Triggers Neo4j writes during entity processing. Near-real-time but violates separation of concerns. Neo4j downtime impacts catalog.
- **Option C — Event-Driven:** Subscribe to catalog change events. Ideal but depends on RHDH event infrastructure availability (future evolution path).

This design implements **Option A** for initial release.

## Goals

- Provide graph traversal queries over AI asset relationships
- Keep Neo4j synchronized with catalog changes via incremental polling
- Support all 6 relationship types (DEPENDS_ON, USES_TOOL, BELONGS_TO, SIMILAR_TO, IMPLEMENTED_BY, INCLUDES)
- Treat catalog as source of truth — Neo4j is a derived index that can be rebuilt
- Implement the Neo4j sync adapter interface from entity-provider SDK (RHIDP-15258)
- Provide setup documentation and example queries

## Non-Goals

- Real-time sync (polling latency 30-60s is acceptable)
- Bidirectional sync (Neo4j → catalog writes are out of scope)
- Graph analytics beyond basic Cypher queries (advanced analytics can be built by users)
- Versioned schema migration (initial release uses schema v1, future changes documented but not automated)

## Decisions

### Decision 1: Catalog API Polling as Primary Sync Mechanism

**Implementation:** Scheduled task runs every 30-60s (configurable), queries catalog search API for AI asset entities, compares against last-synced state tracked in Neo4j or in-memory cache, applies changes (node/relationship create/update/delete).

**Why:**

- Clean separation from catalog internals — uses stable public APIs
- Fully decoupled — Neo4j downtime doesn't impact catalog processing
- Polling latency is acceptable for this use case (relationship queries are not latency-sensitive)
- Can evolve to event-driven (Option C) when RHDH event infrastructure becomes available without changing graph schema

**Code sketch:**

```typescript
// packages/backend/src/plugins/neo4jSync.ts
export async function runSyncCycle(catalog: CatalogApi, neo4j: Neo4jDriver) {
  const entities = await catalog.queryEntities({
    filter: { 'metadata.annotations.rhdh.io/ai-asset-type': '*' },
  });

  for (const entity of entities.items) {
    const lastSyncedRevision = await getLastSyncedRevision(
      neo4j,
      entity.metadata.uid,
    );
    const currentRevision =
      entity.metadata.resourceVersion || entity.metadata.etag;

    if (currentRevision !== lastSyncedRevision) {
      await syncEntityToGraph(neo4j, entity);
      await updateSyncedRevision(neo4j, entity.metadata.uid, currentRevision);
    }
  }
}
```

### Decision 2: Entity Revision Tracking for Incrementality

**Implementation:** Track synced entities using `metadata.resourceVersion` (K8s-style catalog) or `metadata.etag` (if available) or `metadata.annotations['backstage.io/edit-url']` timestamp. Store last-synced revision in Neo4j node property `_syncedRevision` or in a separate tracking node.

**Why:**

- Only process changed entities on each poll cycle — avoids redundant Neo4j writes
- Revision/etag is more reliable than timestamp comparison (handles clock skew)
- If revision tracking is unavailable, fall back to full-sync mode (acceptable for catalogs with <10k entities)

**Code sketch:**

```typescript
interface SyncTracking {
  entityUid: string;
  lastRevision: string;
  lastSyncedAt: string; // ISO 8601 timestamp
}

async function getLastSyncedRevision(
  neo4j: Neo4jDriver,
  entityUid: string,
): Promise<string | null> {
  const result = await neo4j.run(
    'MATCH (n {entityUid: $uid}) RETURN n._syncedRevision AS revision',
    { uid: entityUid },
  );
  return result.records[0]?.get('revision') || null;
}
```

### Decision 3: Catalog-as-Source-of-Truth Architecture

**Implementation:** The adapter only READS from the catalog API, never writes back. Neo4j is a read-only derived index. If Neo4j is wiped, a full-sync can rebuild the entire graph from current catalog state.

**Why:**

- Clear data ownership — catalog owns entity lifecycle
- Neo4j graph can be safely deleted and rebuilt (useful for schema migrations or debugging)
- No risk of sync conflicts or divergence

**Rebuild procedure:**

```bash
# Safe to run — catalog is unaffected
neo4j-admin database drop neo4j
neo4j-admin database create neo4j

# Adapter will detect all entities as unsynchronized and rebuild graph
curl -X POST http://backstage-backend/api/neo4j-sync/trigger-full-sync
```

### Decision 4: Graph Schema Design

**Node types:**

- `Skill` — properties: `entityUid`, `name`, `namespace`, `version`, `description`, `category`, `tags[]`, `_syncedRevision`
- `Tool` — properties: `entityUid`, `name`, `namespace`, `description`, `toolType`, `_syncedRevision`
- `Domain` — properties: `entityUid`, `name`, `namespace`, `description`, `_syncedRevision`
- `Agent` — properties: `entityUid`, `name`, `namespace`, `description`, `_syncedRevision`
- `ModelServer` — properties: `entityUid`, `name`, `namespace`, `modelType`, `_syncedRevision`
- `SkillBundle` — properties: `entityUid`, `name`, `namespace`, `version`, `description`, `category`, `_syncedRevision`

**Relationship types:**

- `DEPENDS_ON` — `(Skill)-[:DEPENDS_ON {versionConstraint}]->(Skill)`
- `USES_TOOL` — `(Skill)-[:USES_TOOL]->(Tool)`
- `BELONGS_TO` — `(Skill|Agent)-[:BELONGS_TO]->(Domain)`
- `SIMILAR_TO` — `(Skill)-[:SIMILAR_TO {similarity}]->(Skill)`
- `IMPLEMENTED_BY` — `(Agent)-[:IMPLEMENTED_BY]->(Skill)`
- `INCLUDES` — `(SkillBundle)-[:INCLUDES]->(Skill)`

**Why:**

- Properties mirror catalog entity metadata — enables graph queries without additional API calls
- `entityUid` links back to catalog for canonical data
- `_syncedRevision` supports incremental sync
- Schema is forward-compatible — adding node/relationship types doesn't break existing queries

**Example Cypher:**

```cypher
// Find all skills that directly or transitively depend on a given skill
MATCH path = (s:Skill {name: 'http-client'})<-[:DEPENDS_ON*]-(dependent:Skill)
RETURN dependent.name, length(path) AS depth
ORDER BY depth;
```

### Decision 5: Relationship Derivation Rules

Each relationship type has documented rules for how it's derived from catalog entity data:

**DEPENDS_ON:**

- Source: `spec.skillcard.dependencies` from skill entity
- Rule: For each dependency `{name, versionConstraint}`, create `(currentSkill)-[:DEPENDS_ON {versionConstraint}]->(dependencySkill)` where dependencySkill matches by name

**USES_TOOL:**

- Source: `spec.skillcard.allowedTools` from skill entity
- Rule: For each tool name, create `(skill)-[:USES_TOOL]->(tool)` where tool matches by name

**BELONGS_TO:**

- Source: `metadata.tags` containing `domain:*` or `metadata.annotations['rhdh.io/ai-asset-category']`
- Rule: Parse domain/category, ensure Domain node exists, create `(skill|agent)-[:BELONGS_TO]->(domain)`

**SIMILAR_TO:**

- Source: `metadata.tags` overlap between skill entities
- Rule: For each skill pair, compute Jaccard similarity = |tags_a ∩ tags_b| / |tags_a ∪ tags_b|. If similarity > 0.3, create `(skillA)-[:SIMILAR_TO {similarity}]->(skillB)`
- Computed during sync, not stored in catalog

**IMPLEMENTED_BY:**

- Source: Catalog entity relations `spec.dependsOn` where agent depends on skill
- Rule: Create `(agent)-[:IMPLEMENTED_BY]->(skill)`

**INCLUDES:**

- Source: SkillBundle entity `spec.skills` listing skill entity references
- Rule: For each skill reference, create `(bundle)-[:INCLUDES]->(skill)`

### Decision 6: Neo4j Driver Configuration

**Implementation:** Use `neo4j-driver` npm package. Configuration via app-config:

```yaml
# app-config.yaml
aiCatalog:
  neo4j:
    uri: bolt://neo4j.example.com:7687
    auth:
      username: neo4j
      password: ${NEO4J_PASSWORD} # K8s Secret reference
    syncInterval: 60 # seconds
```

**Why:**

- `neo4j-driver` is the official Node.js driver, supports both Bolt and Neo4j protocols
- K8s Secret reference keeps credentials out of config files
- Configurable sync interval balances latency vs. load

**Code sketch:**

```typescript
import neo4j from 'neo4j-driver';

export function createNeo4jDriver(config: Config): neo4j.Driver {
  const neo4jConfig = config.getConfig('aiCatalog.neo4j');
  return neo4j.driver(
    neo4jConfig.getString('uri'),
    neo4j.auth.basic(
      neo4jConfig.getString('auth.username'),
      neo4jConfig.getString('auth.password'),
    ),
  );
}
```

## Risks

**Risk 1: Polling latency causes stale graph data**

- **Mitigation:** 30-60s latency is acceptable for relationship queries (not user-facing critical path). Document that Neo4j is "eventually consistent" with catalog. Provide manual sync trigger API for testing.

**Risk 2: Large catalogs (>10k entities) cause slow sync cycles**

- **Mitigation:** Incremental sync processes only changed entities. If full-sync is still slow, introduce batching (sync 1000 entities per cycle, resume on next cycle). Monitor sync duration via metrics.

**Risk 3: Neo4j schema evolution breaks existing queries**

- **Mitigation:** Schema changes are additive (new node/relationship types). Existing queries continue to work. Document schema version in graph metadata node. Provide migration scripts for breaking changes (e.g., renaming relationship types).

**Risk 4: Catalog API query performance degrades as catalog grows**

- **Mitigation:** Use catalog search API with filters (`metadata.annotations.rhdh.io/ai-asset-type`). Pagination if needed. If search API is still slow, consider caching entity list and using `/entities/{uid}` for changed entities only.

**Risk 5: SIMILAR_TO computation is expensive for large catalogs**

- **Mitigation:** Only recompute similarity when skill tags change. Cache similarity scores in Neo4j relationship properties. Introduce similarity threshold (default 0.3) to prune low-similarity edges. Provide option to disable SIMILAR_TO if not needed.
