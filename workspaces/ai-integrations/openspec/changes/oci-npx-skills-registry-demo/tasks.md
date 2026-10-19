# Tasks: Skill Connectors and a Common Catalog Provider

## 1. Shared contract and metadata mapping

- [x] 1.1 Implement and export the design D2 `SkillRecord` and `SkillSnapshot` schemas and runtime validators from `ai-skills-common` for both connectors and the common provider.
- [x] 1.2 Implement design D3's native-field mappings, precedence, optional metadata, and allowlisted extensions; add OCI SkillCard/Markdown and npx fixtures, including conflicting versions.
- [x] 1.3 Implement pure helpers for stable identity, catalog-valid tags, SemVer fallback, and OCI/npx reference serialization with round-trip tests; cover empty, invalid, and overlength tags using Backstage's validator, plus credential-bearing and signed query URLs.
- [ ] 1.4 Test source-discriminated extension validation, deterministic limit ordering, snapshot status invariants, unknown versions, duplicate keys, source mismatch, response/count limits, total discovery budgets, and pagination cycles; document the shared REST contract. _(Shared-library portions complete in `ai-skills-common`: extension validation, ordering, status invariants, version/key/count/size checks, REST contract docs. Remaining: OCI/npx discovery budgets and pagination-cycle tests — connector scope.)_

## 2. OCI connector and REST API

- [x] 2.1 Integrate with the #4747 connector, add paginated public Quay repository and active-tag discovery (all tags when the tag is omitted, otherwise an exact tag filter), preserve distinct tagged references including same-digest aliases, and retain `/images` compatibility. Include the shared HTTP/retry utilities and optional `fetchTimeoutMs`, `maxBlobSizeBytes`, `maxAggregateContentSizeBytes`, `maxDiscoveryResponseSizeBytes`, `maxImages`, `maxRetries`, and `retryBaseDelayMs` acquisition settings documented in design D7.
- [x] 2.2 Resolve each selected tag once, verify digest-addressed manifests and blobs, and expose the resolved manifest digest and stable `<registry>/<repository>:<tag>` key.
- [x] 2.3 Normalize annotated-layer and tar/tar+gzip SkillCard/Markdown layouts using the shared mapping; support valid skillctl images without mandatory manifest metadata annotations.
- [x] 2.4 Enforce design D7's origin, timeout, concurrency, extraction, and size bounds, including connection-level destination validation against DNS rebinding; test DNS changes between validation and connection, integrity failures, traversal, decompression limits, non-skills, malformed candidates, and ambiguous duplicate skill files.
- [x] 2.5 Add authenticated `GET /skills/:sourceId`, atomic snapshots, failed repository/tag keys, and standard Backstage `schedule` configuration for startup/periodic refresh (including configured initial delays and manual trigger mode); test unknown source IDs, loading, partial repository/tag discovery, and empty success. _(Implemented in PR #5284; maintainer testing and review confirmed successful, including the standard Backstage scheduling migration.)_

## 3. npx connector and REST API

- [ ] 3.1 Retrieve and validate Agent Skills v0.2 discovery indexes, including RHESS; process only `skill-md` entries and detect duplicate names.
- [ ] 3.2 Safely retrieve artifacts and verify SHA-256 before decoding; normalize frontmatter and index metadata using the shared mapping.
- [ ] 3.3 Enforce design D7's origin, redirect, timeout, concurrency, and size limits; test invalid entries, digest mismatch, and escaped redirects.
- [ ] 3.4 Add authenticated `GET /skills/:sourceId`, atomic snapshots, failed skill keys, and Backstage startup/periodic refresh scheduling; test the same contract fixtures as OCI.

## 4. Common skill catalog entity provider

- [x] 4.1 Implement one provider with independently configured source instances; resolve connector URLs with Backstage discovery and use service tokens targeted to the receiving plugin ID.
- [x] 4.2 Validate snapshots and construct upstream-compatible `AiResource` entities using design D3/D5 mappings, configured defaults, stable names, and integrity annotations; emit one entity per valid OCI skill-image tag, including aliases of the same digest, and none for confirmed non-skills.
- [ ] 4.3 Persist last-known-good entities, tuples, digests, observation times, and pending deltas/next ownership state with Backstage's database service; recover pending mutations before consuming new snapshots.
- [ ] 4.4 Implement ready/partial/loading/failed handling, stale/repeated snapshot handling, and safe replay after catalog mutation failure or a crash before ownership commit.
- [ ] 4.5 Test partial-result retention, ready-result removal, successful empty discovery, restart during outage, interrupted additions followed by disappearance, invalid responses, duplicate configuration, identity collisions, same-digest OCI tags producing distinct entities, and a tag moving without changing entity identity.

## 5. Configuration and integration verification

- [ ] 5.1 Define backend-only schemas and examples for source configuration and common-provider configuration, including stable source IDs, plugin IDs, expected source types, defaults, namespace, allowed origins, and separate schedules. _(OCI source schema and examples are implemented by task 2.5; npx source and common-provider configuration remain to be implemented.)_
- [ ] 5.2 Add structured source-specific acquisition and reconciliation counters and contextual errors without logging raw content or credentials.
- [ ] 5.3 Add integration coverage for OCI and npx endpoints feeding the same provider, including service authentication and failure isolation across sources.
- [ ] 5.4 Document demo/public-source scope, metadata mappings, the #4747 integration, and the explicit connector-only OCI extraction decision; leave MLflow implementation to a future change.

Task 1.1 was implemented by the `ai-skills-common` package (PR #5061). The
shared-library portions of task 1.4 were completed in the same PR. Task 1.2
was implemented by PR #5072, adding `normalizeOciMetadata` and
`normalizeNpxMetadata` functions with D3 precedence, tag/author normalization,
allowlisted extensions, diagnostics, and native metadata fixtures with
conflicting-version scenarios. Task 2.1 is
implemented by PR #5057, including its acquisition/configuration and all-active-tag
discovery follow-ups. The normalized repository/tag key and per-tag catalog entity
requirements are specified here for the remaining implementation tasks.
Task 2.2 is implemented by PR #5152: tagged acquisitions resolve once, verify
pinned manifests and blobs, and retain internal acquisition metadata using the
shared contract types and reference helpers. The existing raw `/images` response
remains unchanged. Task 2.3 is implemented by PR #5230: supported annotated,
archive, and mixed layouts feed parsed SkillCard/frontmatter into the shared
normalizer, with malformed and ambiguous candidate diagnostics. Task 2.4
acquisition safety is implemented. Task 2.5 adds normalized snapshots
and scheduled refresh in PR #5284. Maintainer testing and review confirmed
the implementation and standard Backstage scheduling migration; task 2.5 is complete. Other unchecked tasks describe the remaining
connector and provider implementation.
