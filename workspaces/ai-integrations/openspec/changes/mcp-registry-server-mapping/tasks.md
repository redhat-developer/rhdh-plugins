<!-- After each completed task, commit the changes. -->
<!-- Group 1 (mapping reference) unblocks everything else. Groups 2 and 3
     can proceed in parallel once Group 1 lands; Group 4 depends on both. -->

## 1. Mapping Reference & Schema Pinning

- [ ] 1.1 Pin the source `server.json` draft schema version this mapping targets and record it (with URL and retrieval date) in a `mapping-reference.md` under the change
- [ ] 1.2 Author the canonical field-mapping table in `mapping-reference.md`: each `server.json` attribute → native entity target OR "projected annotation", including `name`→`metadata.name`(`<name>__<version>`)+`modelcontextprotocol.io/name`, `version`→`modelcontextprotocol.io/version`, `description`/`title`, `websiteUrl`→`metadata.links` (title `Website`), `repository.url`→`metadata.links` (title `Source Code`) + `backstage.io/source-location`, `tags`, `remotes[]`→`spec.remotes[]`
- [ ] 1.3 Document the annotation key rules (dot-separated `modelcontextprotocol.io/attribute.tree.to.leaf`, character sanitization, 63-char truncation + stable hash suffix, collision disambiguation) with worked examples
- [ ] 1.4 Document field-supply rules (`owner` defaults to the constant `unknown`, `lifecycle` defaults to the constant `production` — both overridable by caller defaults, never a failure) and the null/empty-container omission rule

## 2. Direct Field Mapping Implementation

- [ ] 2.1 Implement the `server.json` → `mcp-server` `API` entity transform skeleton (pure function of the document plus caller defaults; no I/O, no timestamps, no randomness)
- [ ] 2.2 Implement identity derivation: sanitize and combine `<name>__<version>` for `metadata.name`, preserve bare name in `modelcontextprotocol.io/name`, version in `modelcontextprotocol.io/version`, with truncation + hash-suffix fallback
- [ ] 2.3 Implement descriptive-metadata mapping (`title`, `description`, `websiteUrl`→`metadata.links` entry titled `Website`, `repository.url` (combined with `repository.subfolder` when present)→`metadata.links` entry titled `Source Code` **and** a `backstage.io/source-location` annotation, `tags` including `mcp`/`ai`)
- [ ] 2.4 Implement `remotes[]` → top-level `spec.remotes[]` (`type`, `url`, source order preserved); when the source has no `remotes` (empty or unset), emit an empty `spec.remotes: []` array (never omitted); ensure no `spec.definition` is emitted
- [ ] 2.5 Implement field-supply: `spec.type: mcp-server`, `spec.owner` set to `unknown` by default (caller override allowed, never a failure), `spec.lifecycle` set to `production` by default (caller override allowed, never a failure)
- [ ] 2.6 Enforce required-source-field validation (`name`, `description`, `version`) with actionable errors that name the missing field

## 3. Annotation Projection Implementation

- [ ] 3.1 Implement the recursive scalar-leaf walker over `server.json` that builds dot-separated paths (object keys, zero-based array indices)
- [ ] 3.2 Implement key sanitization (illegal chars incl. `/`, `$`, `@`, whitespace, leading `_`), the ≤63-char truncation + stable hash suffix, and sanitization-collision disambiguation
- [ ] 3.3 Implement value serialization (scalars to strings) and the null/empty-container omission rule
- [ ] 3.4 Implement the no-overwrite guard so generic projection never clobbers native/dedicated/reserved annotations (`modelcontextprotocol.io/name`, `/version`, …) and skips all source fields with native mappings per `mcp-registry-server-mapping` (e.g. `name`, `version`, `title`, `description`, `websiteUrl`, `repository.url`, `remotes[].type`/`url`)
- [ ] 3.5 Wire remote sub-fields (`headers`, `variables`) and non-native sections (`packages`, `icons`, `repository.source`/`id`, `_meta`) through projection so nothing is dropped
- [ ] 3.6 Implement secret redaction (D9): when an `Input` object declares `isSecret: true`, prune its `default`/`value` leaves from projection (uniformly across `environmentVariables`, remote `headers`/`variables`, and arguments) while still projecting the input's non-secret leaves

## 4. Conformance Fixtures, Verification & Docs

- [ ] 4.1 Create input→expected-output fixtures: minimal server, multi-version (same name, two versions → distinct entities), server with `packages`/`icons`/`_meta`, server with remote `headers`/`variables`, and over-length/collision name cases
- [ ] 4.2 Verify every produced entity passes the upstream `mcp-server` `API` entity schema (`McpServerApiEntity`, PR #34016) — `spec.remotes` required, `spec.definition` not required — rather than the generic base `API` schema
- [ ] 4.3 Verify determinism/idempotency (byte-identical output on repeated runs) and scalar round-trip fidelity (every non-null, non-redacted source scalar recoverable — `isSecret: true` `default`/`value` leaves exempt) via tests over the fixtures
- [ ] 4.4 Add unit tests covering annotation key sanitization, truncation, and collision disambiguation edge cases
- [ ] 4.5 Write the user/consumer documentation: the mapping guide, annotation-key conventions, and a worked `server.json`→entity example (aligned with the upstream `backstage-mcp-server-api.yaml` shape)
- [ ] 4.6 Add a fixture and test covering secret redaction (D9): an `isSecret: true` env var / remote header with a populated `default`/`value` produces no annotation carrying that value, while non-secret sibling leaves still project
