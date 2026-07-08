# Proposal: Neo4j Knowledge Graph Sync Adapter

## Why

AI asset developers and platform administrators need to explore relationships between skills, tools, domains, agents, and model servers to:

- Understand dependency chains when updating skill versions
- Analyze blast radius when changing or deprecating tools
- Discover skills by domain or category
- Find similar skills based on shared capabilities
- Understand which agents use which skills
- Compose skill bundles from related skills

The Backstage catalog stores AI asset metadata but doesn't expose relationship traversal queries. Developers must manually inspect individual entity YAML files to trace dependencies or tool usage. This doesn't scale as the catalog grows.

A Neo4j graph database provides purpose-built relationship traversal, pattern matching, and graph analytics over the AI asset catalog. The sync adapter keeps Neo4j synchronized with the catalog, treating the catalog as the source of truth.

## What Boost Builds

### Neo4j Sync Adapter with Relationship Type Mapping

- Scheduled task polls Backstage catalog search API for AI asset entities (skills, tools, domains, agents, model servers)
- Tracks entity revisions to process only changed entities on each poll cycle
- Creates graph nodes mirroring catalog entity metadata
- Creates typed relationships derived from catalog data:
  - `DEPENDS_ON` — skill version dependencies from `skillcard.yaml`
  - `USES_TOOL` — allowed-tools from `skillcard.yaml`
  - `BELONGS_TO` — domain/category from tags and `rhdh.io/ai-asset-category`
  - `SIMILAR_TO` — computed from tag overlap using Jaccard similarity
  - `IMPLEMENTED_BY` — agent-to-skill mapping from catalog entity relations
  - `INCLUDES` — skill bundle composition
- Incremental sync: only changed entities trigger graph updates
- Sync failures for individual entities are logged and don't abort remaining sync
- Implements the Neo4j sync adapter interface from entity-provider SDK (RHIDP-15258, story RHIDP-15303)

### SkillBundle Node Creation and INCLUDES Relationships

- Creates `SkillBundle` nodes with properties: name, description, domain/category, version
- `INCLUDES` relationships connect bundles to individual skills using canonical entity identifiers
- Bundle definitions can be updated through incremental sync
- Deleting a bundle removes the node and relationships without affecting skill nodes

### Setup Documentation and Graph Schema Reference

- Configuration guide for app-config (Neo4j connection URI, auth, sync schedule)
- Graph schema reference documenting all node types (Skill, Tool, Domain, Agent, ModelServer, SkillBundle) and relationship types
- Example Cypher queries for common use cases:
  - Dependency chain traversal
  - Tool impact analysis
  - Domain-based skill discovery
  - Bundle composition queries
  - Similar skill finding
- Troubleshooting guide for sync failures, connection issues, schema migration
- Architecture documentation explaining catalog-as-source-of-truth design

## Impact

- `workspaces/boost/plugins/catalog-backend-module-neo4j-sync/` — new backend plugin for the sync adapter
- `workspaces/boost/openspec/main/ai-catalog-entity-model/entity-provider-sdk/spec.md` — adapter implements the Neo4j sync adapter interface defined here (cross-reference to RHIDP-15258, story RHIDP-15303)
- `workspaces/boost/openspec/main/ai-catalog-entity-model/annotation-scheme/spec.md` — adapter reads `rhdh.io/ai-asset-*` annotations defined here
- `workspaces/boost/plugins/catalog-backend-module-oci-skills/` — OCI connector produces skill entities with `skillcard.yaml` metadata consumed by this adapter
- `workspaces/boost/docs/neo4j-sync-setup.md` — new setup documentation
- `workspaces/boost/docs/neo4j-graph-schema.md` — new schema reference
- `workspaces/boost/examples/neo4j-queries.cypher` — new example query library
