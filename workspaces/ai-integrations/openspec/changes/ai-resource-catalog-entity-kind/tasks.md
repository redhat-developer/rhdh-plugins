# Tasks: AIResource Catalog Entity Kind

Tracking note: schema/processor work originally landed against a `spec.location` model (RHIDP-14553/14554/14556). RHIDP-15739 retools OCI support onto upstream `backstage.io/source-location` (`url:oci://…`) and removes `spec.location`.

## 1. Upstream Investigation & Schema Foundation

- [x] 1.1 Investigate the upstream `AiResource` kind to confirm the merged model, schema shape, and extension points used by this workspace
- [x] 1.2 Extend or wrap the AIResource schema to support optional `spec.scope` with allowed values `organization`, `product`, and `team`
- [x] 1.3 Add validation for `spec.scope` that reports field path, received value, and accepted values
- [ ] 1.4 Remove RHDH `spec.location` (types, schema, docs, examples) from AIResource OCI/git asset location support
- [ ] 1.5 Retool OCI validation to enforce `backstage.io/source-location` location-ref form `url:oci://…` (type `url`, target starts with `oci://` and is a well-formed OCI reference)
- [ ] 1.6 Ensure AIResource validation errors are actionable and can report multiple errors in one response
- [ ] 1.7 Add/update unit tests covering valid and invalid `spec.scope`, valid and invalid OCI source-location values (including bare `oci://…` without `url:`), and multi-error reporting

## 2. Catalog Ingestion - OCI Processor

- [x] 2.1 Implement `AIResourceOciProcessor` as a `CatalogProcessor` with format-only validation and zero network calls _(initial `spec.location` version)_
- [ ] 2.2 Retool `AIResourceOciProcessor` to validate OCI `backstage.io/source-location` targets instead of `spec.location.target`
- [ ] 2.3 Ensure the OCI processor makes zero outbound HTTP or network calls
- [ ] 2.4 Register/keep `AIResourceOciProcessor` in the catalog backend module under the updated contract
- [ ] 2.5 Add/update unit tests covering valid `url:oci://…` annotations, malformed targets, missing/`url:`-prefix cases, and zero-network behavior

## 3. Catalog Ingestion - Git Path & Registration

- [x] 3.1 Verify git-backed AIResource entities ingest correctly through the existing `UrlReaderProcessor`
- [x] 3.2 Verify a missing `backstage.io/source-location` annotation on a git entity produces a warning rather than an error
- [x] 3.3 Verify AIResource entities are registrable through standard catalog registration and discovery flows
- [ ] 3.4 Add/update integration tests covering git/HTTPS source-location entities and OCI `url:oci://…` source-location entities (registration still via normal catalog locations)

## 4. Entity Detail Page

- [ ] 4.1 Add AIResource kind support to the workspace entity page routing
- [ ] 4.2 Display asset location from `backstage.io/source-location`: HTTPS/git targets as links; `oci://` targets as copyable text
- [ ] 4.3 Ensure the standard relationships graph is present for AIResource entities
- [ ] 4.4 Show a TechDocs tab when `backstage.io/techdocs-ref` is present and hide it when absent
- [ ] 4.5 Add frontend tests covering location rendering, graph presence, and conditional TechDocs display

## 5. Discovery & Filtering

- [ ] 5.1 Verify AIResource entities are returned by `GET /api/catalog/entities?filter=kind=AIResource` (or upstream kind spelling used by the workspace)
- [ ] 5.2 Verify by-name lookup for AIResource entities
- [ ] 5.3 Verify filtering by `spec.type`, `spec.scope`, `spec.owner`, and `spec.lifecycle`
- [ ] 5.4 Verify entities without `spec.scope` are excluded when a scope filter is applied
- [ ] 5.5 Verify AIResource entities appear in catalog full-text search
- [ ] 5.6 Add integration tests for filter and search behavior

## 6. Documentation & Examples

- [x] 6.1 Update the example git-backed AIResource `catalog-info.yaml` (source-location only; no `spec.location`)
- [x] 6.2 Update the example OCI-backed AIResource `catalog-info.yaml` to use `backstage.io/source-location: url:oci://…`
- [ ] 6.3 Document schema fields and registration guidance in the workspace (including why `url:` prefix is required)
- [ ] 6.4 Document the OCI validation-only behavior, air-gap rationale, and that an OCI UrlReader is deferred

## 7. Final Verification

- [ ] 7.1 Walk through each scenario in the local AIResource specs against the implementation
- [ ] 7.2 Update release-facing documentation if the feature ships from this workspace

## Explicitly out of scope (do not implement in this change)

- OCI `UrlReader` / registry content fetch
- Catalog location type `oci` / `readLocation` for discovering entities from OCI
- Custom AI catalog frontend beyond standard entity page adaptations above
