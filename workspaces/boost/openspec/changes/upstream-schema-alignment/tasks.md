# Tasks: Upstream Schema Alignment Readiness

## 1. Annotation Specification Document (P0) — RHIDP-15346

- [ ] 1.1 Document all `rhdh.io/ai-asset-category` values (agent, skill, rule, skill-bundle, mcp-server, ai-model, model-server)
- [ ] 1.2 Document `rhdh.io/ai-asset-version` annotation format and normalization rules
- [ ] 1.3 Document `rhdh.io/ai-asset-source` annotation format
- [ ] 1.4 Document entity kind + `spec.type` mapping table for all AI Asset types
- [ ] 1.5 Map each entity type to RFC #32062 (McpServer) target (if applicable)
- [ ] 1.6 Map each entity type to RFC #33060 (ai-model/ai-model-server) targets (if applicable)
- [ ] 1.7 Assign confidence levels to each mapping (high/medium/low)
- [ ] 1.8 Document fields requiring transformation per entity type
- [ ] 1.9 Add explicit "Future Work" section framing actual migration as separate effort
- [ ] 1.10 Add header with draft status and last-updated date
- [ ] 1.11 Cross-reference `agent-creation-discovery/catalog-entities` spec
- [ ] 1.12 Publish spec in `workspaces/boost/specifications/` directory

## 2. Dry-Run Tooling Scaffold (P1) — RHIDP-15347

- [ ] 2.1 Create `@boost/migration-readiness` CLI package structure
- [ ] 2.2 Set up TypeScript configuration and build pipeline
- [ ] 2.3 Implement catalog API client for entity enumeration
- [ ] 2.4 Filter entities by `rhdh.io/ai-asset-category` annotation presence
- [ ] 2.5 Implement per-entity mapping logic using annotation spec rules
- [ ] 2.6 Generate per-entity report (current → target, transformations, confidence)
- [ ] 2.7 Implement JSON output formatter
- [ ] 2.8 Implement human-readable output formatter
- [ ] 2.9 Handle entities with missing `rhdh.io/ai-asset-category` annotation (exclude gracefully)
- [ ] 2.10 Handle entities with partial annotations (include with warning)
- [ ] 2.11 CLI argument parsing (`--catalog-url`, `--output-format`, `--filter`)
- [ ] 2.12 Add footer message: "This is a migration-readiness assessment. Actual migration is future work pending RFC finalization."

## 3. Testing (P1)

- [ ] 3.1 Unit test mapping logic with fixture entities (all seven AI Asset types)
- [ ] 3.2 Unit test confidence level assignment
- [ ] 3.3 Unit test field transformation identification
- [ ] 3.4 Integration test against mock catalog API
- [ ] 3.5 Test with entities that have no AI Asset annotations (should be excluded)
- [ ] 3.6 Test with entities that have partial annotations (should include with warning)
- [ ] 3.7 Test JSON output format structure
- [ ] 3.8 Test human-readable output format rendering
- [ ] 3.9 Verify read-only: no catalog writes in any code path
- [ ] 3.10 Test CLI argument parsing and validation

## 4. Documentation (P1)

- [ ] 4.1 Write README for `@boost/migration-readiness` package
- [ ] 4.2 Document how to run dry-run tool (command-line usage)
- [ ] 4.3 Document output interpretation (what each field means)
- [ ] 4.4 Document confidence levels and their implications
- [ ] 4.5 Customer-facing messaging: this is readiness assessment, not migration
- [ ] 4.6 Cross-reference annotation specification document
- [ ] 4.7 Add tracking links for RFC #32062 and RFC #33060
- [ ] 4.8 Document future work: actual migration, processor hook

## 5. Cross-References and Dependencies (P2)

- [ ] 5.1 Cross-reference RHDHPLAN-1507's `ai-catalog-entity-model` change
- [ ] 5.2 Cross-reference `agent-creation-discovery/catalog-entities` spec
- [ ] 5.3 Link to Backstage RFCs #32062 and #33060
- [ ] 5.4 Cross-reference RHDHPLAN-1507 RHIDP-15302 and RHIDP-15303 (migration-readiness stories in the entity model epic)
- [ ] 5.5 Update `ai-catalog-entity-model` change to reference this specification
