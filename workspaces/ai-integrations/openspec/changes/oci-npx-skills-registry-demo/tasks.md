# Tasks: Skill Connectors and a Common Catalog Provider

## 1. Shared contract and metadata mapping

- [ ] 1.1 Implement and export the design D2 `SkillRecord` and `SkillSnapshot` schemas and runtime validators from `skills-common` for both connectors and the common provider.
- [ ] 1.2 Implement design D3's native-field mappings, precedence, optional metadata, and allowlisted extensions; add OCI SkillCard/Markdown and npx fixtures, including conflicting versions.
- [ ] 1.3 Implement pure helpers for stable identity, catalog-valid tags, SemVer fallback, and OCI/npx reference serialization with round-trip tests; cover empty, invalid, and overlength tags using Backstage's validator, plus credential-bearing and signed query URLs.
- [ ] 1.4 Test source-discriminated extension validation, deterministic limit ordering, snapshot status invariants, unknown versions, duplicate keys, source mismatch, response/count limits, total discovery budgets, and pagination cycles; document the shared REST contract.

## 2. OCI connector and REST API

- [ ] 2.1 Integrate with the #4747 connector, add paginated public Quay organization discovery and configured tag selection, and retain `/images` compatibility.
- [ ] 2.2 Resolve tags once, verify digest-addressed manifests and blobs, and expose the resolved manifest digest and stable repository key.
- [ ] 2.3 Normalize annotated-layer and tar/tar+gzip SkillCard/Markdown layouts using the shared mapping; support valid skillctl images without mandatory manifest metadata annotations.
- [ ] 2.4 Enforce design D7's origin, timeout, concurrency, extraction, and size bounds; test integrity failures, traversal, decompression limits, non-skills, malformed candidates, and ambiguous duplicate skill files.
- [ ] 2.5 Add authenticated `GET /skills/:sourceId`, atomic snapshots, failed repository keys, and Backstage startup/periodic refresh scheduling; test unknown source IDs, loading, partial discovery, and empty success.

## 3. npx connector and REST API

- [ ] 3.1 Retrieve and validate Agent Skills v0.2 discovery indexes, including RHESS; process only `skill-md` entries and detect duplicate names.
- [ ] 3.2 Safely retrieve artifacts and verify SHA-256 before decoding; normalize frontmatter and index metadata using the shared mapping.
- [ ] 3.3 Enforce design D7's origin, redirect, timeout, concurrency, and size limits; test invalid entries, digest mismatch, and escaped redirects.
- [ ] 3.4 Add authenticated `GET /skills/:sourceId`, atomic snapshots, failed skill keys, and Backstage startup/periodic refresh scheduling; test the same contract fixtures as OCI.

## 4. Common skill catalog entity provider

- [ ] 4.1 Implement one provider with independently configured source instances; resolve connector URLs with Backstage discovery and use service tokens targeted to the receiving plugin ID.
- [ ] 4.2 Validate snapshots and construct upstream-compatible `AiResource` entities using design D3/D5 mappings, configured defaults, stable names, and integrity annotations.
- [ ] 4.3 Persist last-known-good entities, tuples, digests, observation times, and pending deltas/next ownership state with Backstage's database service; recover pending mutations before consuming new snapshots.
- [ ] 4.4 Implement ready/partial/loading/failed handling, stale/repeated snapshot handling, and safe replay after catalog mutation failure or a crash before ownership commit.
- [ ] 4.5 Test partial-result retention, ready-result removal, successful empty discovery, restart during outage, interrupted additions followed by disappearance, invalid responses, duplicate configuration, and identity collisions.

## 5. Configuration and integration verification

- [ ] 5.1 Define backend-only schemas and examples for source configuration and common-provider configuration, including stable source IDs, plugin IDs, expected source types, defaults, namespace, allowed origins, and separate schedules.
- [ ] 5.2 Add structured source-specific acquisition and reconciliation counters and contextual errors without logging raw content or credentials.
- [ ] 5.3 Add integration coverage for OCI and npx endpoints feeding the same provider, including service authentication and failure isolation across sources.
- [ ] 5.4 Document demo/public-source scope, metadata mappings, the #4747 integration, and the explicit connector-only OCI extraction decision; leave MLflow implementation to a future change.

All tasks describe future implementation. This specification-only PR does not
complete implementation tasks or change runtime packages/configuration.
