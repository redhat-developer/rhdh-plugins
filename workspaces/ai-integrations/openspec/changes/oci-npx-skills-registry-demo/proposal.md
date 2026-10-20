# Proposal: Skill Connectors and a Common Catalog Provider

## Why

RHDH needs to demonstrate that skills from OCTO skillimage OCI artifacts and
npx-compatible registries appear as first-class catalog entities. Each source
has its own retrieval protocol and metadata vocabulary, but catalog identity,
annotations, defaults, and synchronization need one consistent implementation.

## What Changes

- Define a shared, versioned REST contract for normalized skill records and
  source snapshot status, plus a native-field-to-skill-to-`AiResource` mapping.
- Add an OCI connector that discovers public Quay repositories, verifies and
  extracts skill metadata, and exposes normalized records through its router.
  Build on the connector in PR #4747 rather than create a competing OCI client.
  Discover all active tags when no exact tag is configured, and preserve one
  record and catalog entry per tag that contains a valid OCI skill image.
  Different tags remain distinct even when they point to the same manifest.
- Harden OCI acquisition with validated connection destinations and IPv6/IPv4
  fallback, generic HTTPS registry-subdomain redirects, and bounded downloads,
  decompression, concurrency, retries, and total source-operation time. Reject
  oversized candidates without preventing independent candidates from processing.
- Publish extracted OCI skill Markdown as TechDocs for `AiResource` entities
  with `spec.type: skill`. The OCI connector serves extracted Markdown through
  a dedicated authenticated endpoint addressed by source ID and verified
  manifest digest. The catalog provider annotates OCI skill entities with
  `backstage.io/techdocs-ref` using Backstage discovery and trusted
  connector/source configuration. The existing URL-reader plugin retrieves
  skill documentation using service tokens, validates the digest-addressed route,
  trusts the authenticated connector's verified content binding, and produces a
  minimal MkDocs project for TechDocs rendering. The manifest digest identifies
  the OCI manifest; it is not a hash of the extracted Markdown bytes.
  The connector alone acquires and extracts OCI artifacts; no direct OCI
  UrlReader is added. This increment covers OCI skill documentation only;
  npx TechDocs is deferred to a future change.
- Add an npx connector that verifies `skill-md` artifacts from public Agent
  Skills v0.2 indexes, including RHESS, and exposes the same REST contract.
- Add one common catalog entity provider implementation that consumes both
  connectors and creates upstream-compatible `AiResource` entities with
  `spec.type: skill` and the existing RHDH AI Catalog annotations.
- Keep source acquisition and catalog reconciliation independently scheduled,
  with explicit incomplete-snapshot behavior and last-known-good retention.

## Non-goals

- Product support, export-overlay packaging, or private-registry credentials.
- Managing registry sources from RHDH or crawling arbitrary Git repositories.
- A skill marketplace, skill execution, RBAC changes, or UI changes.
- Implementing an MLflow connector or inventing its native metadata mapping.
- Adopting the current WIP ORAS-based OCI client. This may be revisited after
  evaluating its compatibility with OCTO skillimages; if adopted for the POC,
  the OpenSpec will be updated in a follow-up change before that implementation.
- Changing the core `AiResource` schema, adding an OCI `UrlReader`, or making
  catalog processors download skill content. The existing URL reader retrieves
  extracted content over connector HTTP; the connector alone acquires and
  extracts OCI artifacts.
- Adding npx skill TechDocs in this increment.

Bounded OCI layer extraction is in scope for the connector. The common catalog
provider consumes normalized metadata and does not download or extract images.
This explicitly replaces the earlier manifest-only discovery restriction.

## Capabilities

### New Capabilities

- `skills-common`: Shared record and snapshot schemas, metadata mapping
  rules, validation, and pure identity/reference helpers, implemented by the
  `ai-skills-common` package.
- `oci-skills-connector`: Public Quay/OCTO connector, normalized REST API, and
  dedicated authenticated Markdown endpoint for OCI skill TechDocs.
- `npx-skills-connector`: Public npx-compatible connector and normalized REST API.
- `skills-catalog-provider`: Common REST consumer, `AiResource` construction,
  OCI-only `backstage.io/techdocs-ref` annotation, and source-isolated catalog
  reconciliation.

The two connectors feed `skills-catalog-provider`, the sole catalog entity
provider capability. The `skills-common` capability supplies the
`ai-skills-common` library shared by all three.

### Modified Capabilities

- `techdocs-integration`: Extended URL-reader capability for OCI skill
  documentation, reusing the existing model-card URL reader's pattern
  (service-token authentication, HTTP retrieval, minimal MkDocs project). These added
  requirements extend the capability owned by `techdocs-modelcard-finalization`;
  preserve that change's model-card requirements when syncing both changes.

## Canonical Touchpoints

- [PR #4747](https://github.com/redhat-developer/rhdh-plugins/pull/4747): OCI
  acquisition foundation. Its current raw `/images` response is not the shared
  skill contract; the implementation must add normalized records, resolved
  digests, discovery, and scheduled refresh without breaking that endpoint.
- [Model connector architecture](../transition-oai-connector-to-kserve-plugin/design.md#decision-1-two-plugin-architecture--connector--entity-provider):
  reuse the connector/router and catalog-provider separation for skills.
- [AiResource foundation](../ai-resource-catalog-entity-kind/design.md#d5---oci-ingestion-performs-format-validation-only):
  reuse its schema and source-location convention. Its catalog processor stays
  format-only; acquisition is owned by the separate connector in this change.
- `airesource-agent-typed-schema` owns agent fields, which are outside this change.
- [Model-card TechDocs integration](../techdocs-modelcard-finalization/specs/techdocs-integration/spec.md):
  existing model-card URL-reader and TechDocs pattern to consult for
  compatibility. The OCI skill TechDocs reuses the same HTTP-based connector
  Markdown route, discovery-resolved `backstage.io/techdocs-ref` annotation,
  and URL-reader service-token authentication with minimal MkDocs project
  generation.
- `plugins/catalog-techdoc-url-reader-backend/src/plugin.ts`: receiving-plugin
  service-token authentication and HTTP retrieval pattern for extending the
  URL reader to OCI skill documentation.

**Change type**: feature-spec

## Impact

- **Connector backends**: Public registry clients expose authenticated,
  normalized skill snapshots independently of the catalog. The OCI connector
  additionally serves extracted skill Markdown through a dedicated
  digest-addressed endpoint for TechDocs consumption; it retains content for
  last-known-good entities through partial refreshes and restarts. Content
  cleanup requires a post-commit acknowledgment from the configured catalog
  provider; storage pressure rejects new admissions rather than evicting retained
  documentation.
- **Catalog backend**: A common provider maps snapshots to `AiResource` entities.
  For OCI skills, the provider sets a `backstage.io/techdocs-ref` annotation
  using Backstage discovery and trusted connector/source configuration, bound
  to the verified manifest digest on the entity.
- **TechDocs backend**: The existing URL-reader plugin is extended to match OCI
  skill documentation URLs from trusted configured connector destinations,
  authenticate with service tokens targeted to the receiving connector plugin,
  and produce a minimal MkDocs project for TechDocs rendering.
- **Deployment**: Sources and catalog consumers are statically configured in
  `app-config.yaml`; both remain demo-only.
  Omitting the OCI discovery tag now selects all active tags; operators wanting
  the former behavior must explicitly set `tag: latest`. The normalized OCI key
  includes the tag, so any experimental repository-only catalog identities must
  be reconciled as old identities rather than silently reassigned to a tag.
- **Dependencies**: Public HTTPS registries and Backstage discovery, auth,
  scheduler, and durable backend storage. This PR changes specifications only.
