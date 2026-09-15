# Proposal: OCI and npx Skills Catalog Providers

## Why

RHDH needs to demonstrate that skills published through OCTO skillimage OCI
artifacts and npx-compatible registries can appear as first-class catalog
entities with consistent RHDH AI Catalog metadata.

## What Changes

- Add a shared utility for provider identity, entity construction, annotation
  normalization, and error isolation.
- Add an OCI provider that discovers public skillimage artifacts in a Quay
  namespace and emits one `AiResource` per skill.
- Add an npx skills provider that consumes public npx-compatible Agent Skills
  v0.2 discovery indexes, including RHESS.
- Emit upstream-compatible `AiResource` entities with `spec.type: skill`,
  `backstage.io/source-location`, and retained RHDH AI Catalog annotations.

## Non-goals

- Product support, export-overlay packaging, or private-registry credentials.
- OCI image-layer extraction during catalog ingestion.
- Managing registry sources from RHDH or crawling arbitrary Git repositories.
- A skill marketplace, skill execution, RBAC changes, or UI changes.

## Capabilities

### New Capabilities

- `skills-provider-sdk`: Shared construction, validation, identity, and sync
  utilities for skill entity providers.
- `oci-skills-provider`: Public Quay/OCTO skillimage catalog provider.
- `npx-skills-provider`: Public npx-compatible catalog provider.

### Modified Capabilities

_(none)_

## Impact

- **Catalog backend**: New entity providers emit `AiResource` entities.
- **Deployment**: Provider instances are configured statically in
  `app-config.yaml` and remain demo-only.
- **Dependencies**: Public HTTPS registry APIs only.
