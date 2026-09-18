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
- Changing the core `AiResource` schema, adding an OCI `UrlReader`, or making
  catalog processors download skill content.

Bounded OCI layer extraction is in scope for the connector. The common catalog
provider consumes normalized metadata and does not download or extract images.
This explicitly replaces the earlier manifest-only discovery restriction.

## Capabilities

### New Capabilities

- `skills-provider-sdk`: Shared record and snapshot schemas, metadata mapping
  rules, validation, and pure identity/reference helpers.
- `oci-skills-provider`: Public Quay/OCTO connector and normalized REST API.
- `npx-skills-provider`: Public npx-compatible connector and normalized REST API.
- `skills-catalog-provider`: Common REST consumer, `AiResource` construction,
  and source-isolated catalog reconciliation.

The existing OCI/npx capability names are retained; their role is now source
data provision, not Backstage `EntityProvider` implementation.

### Modified Capabilities

_(none)_

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

**Change type**: feature-spec

## Impact

- **Connector backends**: Public registry clients expose authenticated,
  normalized skill snapshots independently of the catalog.
- **Catalog backend**: A common provider maps snapshots to `AiResource` entities.
- **Deployment**: Sources and catalog consumers are statically configured in
  `app-config.yaml`; both remain demo-only.
- **Dependencies**: Public HTTPS registries and Backstage discovery, auth,
  scheduler, and durable backend storage. This PR changes specifications only.
