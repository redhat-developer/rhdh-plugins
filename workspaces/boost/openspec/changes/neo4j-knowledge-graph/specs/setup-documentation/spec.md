# Setup Documentation and Graph Schema Reference

> **Status: Draft** — Pre-implementation specification. Subject to change during implementation.

The Neo4j sync adapter requires setup documentation covering configuration, graph schema reference, example queries, troubleshooting, and architecture.

## ADDED Requirements

### Requirement: Configuration Guide in Setup Documentation

Documentation covers adapter configuration in app-config and environment setup.

#### Scenario: Basic configuration example in docs

- **WHEN** a user reads the setup documentation at `workspaces/boost/docs/neo4j-sync-setup.md`
- **THEN** the docs include a basic configuration example:

  ```yaml
  # app-config.yaml
  aiCatalog:
    neo4j:
      # Neo4j connection URI (bolt:// or neo4j://)
      uri: bolt://neo4j.example.com:7687

      # Authentication credentials
      auth:
        username: neo4j
        password: ${NEO4J_PASSWORD} # Reference to K8s Secret

      # Sync interval in seconds (default: 60)
      syncInterval: 60

      # Jaccard similarity threshold for SIMILAR_TO relationships (default: 0.3)
      similarityThreshold: 0.3

      # Enable/disable SIMILAR_TO computation (default: true)
      computeSimilarity: true
  ```

#### Scenario: Kubernetes Secret setup documented

- **WHEN** a user reads the setup documentation
- **THEN** the docs include instructions for creating a K8s Secret:

  ```bash
  # Create Secret
  kubectl create secret generic neo4j-credentials \
    --from-literal=password='your-neo4j-password' \
    -n rhdh

  # Reference in app-config
  envsubst < app-config.template.yaml > app-config.yaml

  # Or use Backstage secret backend plugin
  backend:
    database:
      pluginDivisionMode: schema
    secrets:
      neo4j:
        password:
          $env: NEO4J_PASSWORD
  ```

#### Scenario: Manual sync trigger API documented

- **WHEN** a user reads the setup documentation
- **THEN** the docs include API endpoint for manual sync:

  ```bash
  # Trigger full sync (useful after Neo4j database rebuild)
  curl -X POST http://backstage-backend:7007/api/neo4j-sync/trigger-full-sync

  # Response:
  {
    "status": "success",
    "syncReport": {
      "entitiesProcessed": 1523,
      "entitiesSuccess": 1520,
      "entitiesFailed": 3,
      "nodesCreated": 1520,
      "relationshipsCreated": 4832,
      "durationMs": 8420
    }
  }
  ```

### Requirement: Graph Schema Reference Documentation

Documentation includes a complete graph schema reference with all node types, relationship types, and properties.

#### Scenario: Node types documented with properties

- **WHEN** a user reads `workspaces/boost/docs/neo4j-graph-schema.md`
- **THEN** the docs include a table of node types:

  | Node Type     | Properties                                                                                          | Description                |
  | ------------- | --------------------------------------------------------------------------------------------------- | -------------------------- |
  | `Skill`       | `entityUid`, `name`, `namespace`, `version`, `description`, `category`, `tags[]`, `_syncedRevision` | AI skills from catalog     |
  | `Tool`        | `entityUid`, `name`, `namespace`, `description`, `toolType`, `_syncedRevision`                      | MCP tools, CLI tools, APIs |
  | `Domain`      | `entityUid`, `name`, `namespace`, `description`, `_syncedRevision`                                  | Domain/category groupings  |
  | `Agent`       | `entityUid`, `name`, `namespace`, `description`, `_syncedRevision`                                  | AI agents that use skills  |
  | `ModelServer` | `entityUid`, `name`, `namespace`, `modelType`, `_syncedRevision`                                    | LLM provider endpoints     |
  | `SkillBundle` | `entityUid`, `name`, `namespace`, `version`, `description`, `category`, `_syncedRevision`           | Curated skill collections  |

#### Scenario: Relationship types documented with semantics

- **WHEN** a user reads the graph schema reference
- **THEN** the docs include a table of relationship types:

  | Relationship     | Source → Target      | Properties           | Derivation Rule                                  |
  | ---------------- | -------------------- | -------------------- | ------------------------------------------------ |
  | `DEPENDS_ON`     | Skill → Skill        | `versionConstraint`  | From `spec.skillcard.dependencies`               |
  | `USES_TOOL`      | Skill → Tool         | —                    | From `spec.skillcard.allowedTools`               |
  | `BELONGS_TO`     | Skill/Agent → Domain | —                    | From `metadata.tags` (`domain:*` prefix)         |
  | `SIMILAR_TO`     | Skill → Skill        | `similarity` (float) | Computed from tag overlap (Jaccard similarity)   |
  | `IMPLEMENTED_BY` | Agent → Skill        | —                    | From catalog entity relations (`spec.dependsOn`) |
  | `INCLUDES`       | SkillBundle → Skill  | —                    | From `spec.skills` list in SkillBundle entity    |

#### Scenario: Catalog-as-source-of-truth architecture explained

- **WHEN** a user reads the graph schema reference
- **THEN** the docs include an architecture section explaining:
  - Neo4j is a derived read-only index
  - The Backstage catalog is the source of truth for all entity data
  - Neo4j can be safely deleted and rebuilt from catalog
  - The adapter only READS from catalog API, never writes back
  - Sync latency is 30-60s (eventual consistency)

### Requirement: Example Cypher Query Library

Documentation includes at least 5 example Cypher queries for common use cases.

#### Scenario: Dependency chain traversal query

- **WHEN** a user reads `workspaces/boost/examples/neo4j-queries.cypher`
- **THEN** the file includes:
  ```cypher
  // Find all skills that directly or transitively depend on a given skill
  // Use case: Understand blast radius when updating a foundational skill
  MATCH path = (s:Skill {name: 'http-client'})<-[:DEPENDS_ON*]-(dependent:Skill)
  RETURN dependent.name, dependent.version, length(path) AS depth
  ORDER BY depth, dependent.name;
  ```

#### Scenario: Tool impact analysis query

- **WHEN** a user reads the example query library
- **THEN** the file includes:
  ```cypher
  // Find all skills that use a specific tool
  // Use case: Assess impact before deprecating or changing a tool
  MATCH (skill:Skill)-[:USES_TOOL]->(tool:Tool {name: 'github'})
  RETURN skill.name, skill.category, skill.version
  ORDER BY skill.category, skill.name;
  ```

#### Scenario: Domain-based skill discovery query

- **WHEN** a user reads the example query library
- **THEN** the file includes:
  ```cypher
  // Find all skills in a domain and their dependencies
  // Use case: Discover skills for a specific use case (e.g., security)
  MATCH (domain:Domain {name: 'security'})<-[:BELONGS_TO]-(skill:Skill)
  OPTIONAL MATCH (skill)-[:DEPENDS_ON]->(dep:Skill)
  RETURN skill.name, skill.description, collect(dep.name) AS dependencies
  ORDER BY skill.name;
  ```

#### Scenario: Bundle composition query

- **WHEN** a user reads the example query library
- **THEN** the file includes:
  ```cypher
  // Find all skills in a bundle with their transitive dependencies
  // Use case: Understand what needs to be deployed for a skill bundle
  MATCH (bundle:SkillBundle {name: 'security-toolkit'})-[:INCLUDES]->(skill:Skill)
  OPTIONAL MATCH path = (skill)-[:DEPENDS_ON*]->(dep:Skill)
  RETURN skill.name, collect(DISTINCT dep.name) AS transitiveDeps
  ORDER BY skill.name;
  ```

#### Scenario: Similar skill finding query

- **WHEN** a user reads the example query library
- **THEN** the file includes:
  ```cypher
  // Find skills similar to a given skill (based on tag overlap)
  // Use case: Suggest alternative skills or related capabilities
  MATCH (s:Skill {name: 'jira-triage'})-[r:SIMILAR_TO]->(similar:Skill)
  WHERE r.similarity > 0.4
  RETURN similar.name, similar.description, r.similarity AS score
  ORDER BY score DESC
  LIMIT 5;
  ```

### Requirement: Troubleshooting Guide

Documentation includes troubleshooting steps for common issues.

#### Scenario: Sync failure troubleshooting documented

- **WHEN** a user reads the troubleshooting section
- **THEN** the docs include:

  ````markdown
  ## Troubleshooting Sync Failures

  ### Check sync status

  ```bash
  # View recent sync logs
  kubectl logs -n rhdh deployment/backstage-backend | grep neo4j-sync

  # Check Prometheus metrics
  curl http://backstage-backend:7007/metrics | grep neo4j_sync
  ```

  ### Common issues

  **Entities not syncing:**

  - Verify entity has `metadata.annotations.rhdh.io/ai-asset-category`
  - Check entity revision is changing (compare `resourceVersion` between syncs)
  - Trigger manual full sync: `curl -X POST .../trigger-full-sync`

  **Neo4j connection failures:**

  - Verify `aiCatalog.neo4j.uri` is reachable from backend pod
  - Check credentials in K8s Secret
  - Test connection: `kubectl exec -it deployment/backstage-backend -- curl bolt://neo4j.example.com:7687`

  **High sync latency:**

  - Reduce `syncInterval` (trade-off: increased catalog API load)
  - Disable `computeSimilarity` if not needed (reduces CPU during sync)
  - Check catalog search API performance: `curl '.../api/catalog/entities?filter=...'`
  ````

#### Scenario: Schema migration documented

- **WHEN** a user reads the troubleshooting section
- **THEN** the docs include:

  ````markdown
  ## Schema Migration

  The Neo4j graph schema may evolve across versions. Schema changes are additive (new node/relationship types) and backward-compatible.

  ### Rebuilding graph after schema change

  1. Stop the sync adapter:
     ```bash
     kubectl scale deployment/backstage-backend --replicas=0 -n rhdh
     ```
  2. Drop and recreate Neo4j database:
     ```bash
     neo4j-admin database drop neo4j
     neo4j-admin database create neo4j
     ```
  3. Restart adapter and trigger full sync:
     ```bash
     kubectl scale deployment/backstage-backend --replicas=1 -n rhdh
     curl -X POST http://backstage-backend:7007/api/neo4j-sync/trigger-full-sync
     ```
  4. Monitor sync progress:
     ```bash
     kubectl logs -f deployment/backstage-backend -n rhdh | grep neo4j-sync
     ```
  ````

### Requirement: Metrics and Observability Documentation

Documentation covers metrics exported by the adapter for monitoring.

#### Scenario: Prometheus metrics documented

- **WHEN** a user reads the setup documentation
- **THEN** the docs include a metrics section:

  ````markdown
  ## Metrics

  The adapter exports Prometheus metrics at `/metrics`:

  | Metric                              | Type      | Description                                |
  | ----------------------------------- | --------- | ------------------------------------------ |
  | `neo4j_sync_total`                  | Counter   | Total sync cycles executed                 |
  | `neo4j_sync_success`                | Counter   | Sync cycles completed successfully         |
  | `neo4j_sync_failures`               | Counter   | Sync cycles with errors                    |
  | `neo4j_sync_duration_seconds`       | Histogram | Time taken per sync cycle                  |
  | `neo4j_entities_processed_total`    | Counter   | Total entities processed across all cycles |
  | `neo4j_entities_synced_total`       | Counter   | Entities successfully synced               |
  | `neo4j_entities_failed_total`       | Counter   | Entities that failed to sync               |
  | `neo4j_nodes_created_total`         | Counter   | Total graph nodes created                  |
  | `neo4j_relationships_created_total` | Counter   | Total graph relationships created          |

  ### Example Grafana queries

  ```promql
  # Sync success rate over last hour
  rate(neo4j_sync_success[1h]) / rate(neo4j_sync_total[1h])

  # Average sync duration
  rate(neo4j_sync_duration_seconds_sum[5m]) / rate(neo4j_sync_duration_seconds_count[5m])

  # Entity sync failure rate
  rate(neo4j_entities_failed_total[5m])
  ```
  ````

### Requirement: Documentation Coverage Validation

All setup documentation must be validated before release.

#### Scenario: Documentation includes all required sections

- **WHEN** the documentation is reviewed before release
- **THEN** `neo4j-sync-setup.md` includes sections:
  - Prerequisites (Neo4j version, Backstage version)
  - Configuration (app-config.yaml, K8s Secrets)
  - Installation (backend plugin setup)
  - Verification (manual sync trigger, query examples)
  - Metrics and Monitoring
  - Troubleshooting
- **AND** `neo4j-graph-schema.md` includes sections:
  - Node Types (table with properties)
  - Relationship Types (table with semantics)
  - Derivation Rules (how relationships are computed)
  - Architecture (catalog-as-source-of-truth)
  - Schema Versioning
- **AND** `examples/neo4j-queries.cypher` includes at least 5 example queries with use case comments
