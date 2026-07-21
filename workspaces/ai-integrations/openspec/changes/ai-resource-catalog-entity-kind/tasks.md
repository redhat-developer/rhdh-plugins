# Tasks: AIResource Catalog Entity Kind

## 1. Upstream Investigation & Schema Foundation

- [ ] 1.1 Investigate the upstream `AIResource` kind to confirm the merged model, schema shape, and extension points used by this workspace
- [ ] 1.2 Extend or wrap the AIResource schema to support optional `spec.scope` with allowed values `organization`, `product`, and `team`
- [ ] 1.3 Add validation for `spec.scope` that reports field path, received value, and accepted values
- [ ] 1.4 Add `oci://` prefix validation for `spec.location.target` when `spec.location.type` is `oci`
- [ ] 1.5 Ensure AIResource validation errors are actionable and can report multiple errors in one response
- [ ] 1.6 Add unit tests covering valid and invalid `spec.scope`, valid and invalid OCI targets, and multi-error reporting

## 2. Catalog Ingestion - OCI Processor

- [ ] 2.1 Implement `AIResourceOciProcessor` as a `CatalogProcessor` that validates `spec.location.target` format only
- [ ] 2.2 Ensure the OCI processor makes zero outbound HTTP or network calls
- [ ] 2.3 Register `AIResourceOciProcessor` in the catalog backend module
- [ ] 2.4 Add unit tests covering valid OCI targets, malformed targets, and zero-network behavior

## 3. Catalog Ingestion - Git Path & Registration

- [ ] 3.1 Verify git-backed AIResource entities ingest correctly through the existing `UrlReaderProcessor`
- [ ] 3.2 Verify a missing `backstage.io/source-location` annotation on a git entity produces a warning rather than an error
- [ ] 3.3 Verify AIResource entities are registrable through standard catalog registration and discovery flows
- [ ] 3.4 Add integration tests covering both git-backed and OCI-backed ingestion paths

## 4. Entity Detail Page

- [ ] 4.1 Add AIResource kind support to the workspace entity page routing
- [ ] 4.2 Add an AIResource location display that renders git targets as links and OCI targets as copyable text
- [ ] 4.3 Ensure the standard relationships graph is present for AIResource entities
- [ ] 4.4 Show a TechDocs tab when `backstage.io/techdocs-ref` is present and hide it when absent
- [ ] 4.5 Add frontend tests covering location rendering, graph presence, and conditional TechDocs display

## 5. Discovery & Filtering

- [ ] 5.1 Verify AIResource entities are returned by `GET /api/catalog/entities?filter=kind=AIResource`
- [ ] 5.2 Verify by-name lookup for AIResource entities
- [ ] 5.3 Verify filtering by `spec.type`, `spec.scope`, `spec.owner`, and `spec.lifecycle`
- [ ] 5.4 Verify entities without `spec.scope` are excluded when a scope filter is applied
- [ ] 5.5 Verify AIResource entities appear in catalog full-text search
- [ ] 5.6 Add integration tests for filter and search behavior

## 6. Documentation & Examples

- [ ] 6.1 Add an example git-backed AIResource `catalog-info.yaml`
- [ ] 6.2 Add an example OCI-backed AIResource `catalog-info.yaml`
- [ ] 6.3 Document schema fields and registration guidance in the workspace
- [ ] 6.4 Document the OCI validation-only behavior and its air-gap rationale

## 7. Final Verification

- [ ] 7.1 Walk through each scenario in the local AIResource specs against the implementation
- [ ] 7.2 Update release-facing documentation if the feature ships from this workspace
