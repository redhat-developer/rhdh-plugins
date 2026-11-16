# Proposal: AI Catalog Metadata and Provenance

## Why

[RHIDP-18844](https://redhat.atlassian.net/browse/RHIDP-18844), under
[RHIDP-18839](https://redhat.atlassian.net/browse/RHIDP-18839), needs a precise
metadata and provenance contract so that catalog consumers can identify an AI
asset and its origin consistently. Current providers diverge in annotation
population, Location entity generation, and provenance tracking. Without a
shared contract, consumers cannot reliably determine which connector ingested an
entity, how to correlate it with its source, or what its lifecycle is.

The [provider inventory](../ai-catalog-provider-adoption/provider-inventory.md)
(RHIDP-18843) records the current identity, provenance, missing annotations,
and absence of emitted Location entities across all five provider classes.
This change specifies the metadata and Location correlation contract that
providers must adopt.

## What Changes

- Document the three baseline annotations (`rhdh.io/ai-asset-category`,
  `rhdh.io/ai-asset-version`, `rhdh.io/ai-asset-source`) with formal
  required/optional rules, validation behavior, and examples grounded in
  current implementation evidence.
- Map each supported kind/`spec.type` pair to an `rhdh.io/ai-asset-category`
  value using the current taxonomy. No Neo4j, SkillBundle, or graph/bundle
  scope.
- Require adopting providers to generate one Location per configured logical
  source and ingestion path. Define stable identity, targetless source records, ownership, and
  lifecycle, including configured sources with zero current assets.
- Make `rhdh.io/ai-asset-source` a canonical full Location entity reference.
  Require matching `rhdh.io/ai-source-ref` metadata on the Location so assets
  and source records share one resolvable source identity. Source Locations use
  their own validation path and remain outside AI asset classification.
- Keep Backstage management/origin `<type>:<target>` location references separate
  from the source entity reference; do not use bare Location names as references.
- Distinguish a catalog Location entity, the `backstage.io/managed-by-location`
  / `backstage.io/managed-by-origin-location` annotations, and the mutation
  `locationKey` parameter.
- Account for API-origin sources (OGX `/v1/models`, MCP registry, KServe
  informer), configuration, and catalog descriptor imports. Provider-owned source
  Locations use `spec: {}` with no discovery targets; providers continue to own
  remote retrieval. Preserve actual import provenance and prevent duplicate
  ingestion within a catalog using deterministic identity and explicit ownership.
- Cover edge cases: conflicting metadata from multiple sources, missing source
  data, multi-instance registries, and credential-free provenance examples
  with safe-exposure rules.
- Record that frontend feedback on the annotation baseline is pending. Label
  the working baseline as provisional and never claim stakeholder approval.

This change is being authored as docs-only planning. The
[design](design.md) records metadata and Location decisions; the
[behavioral specification](specs/ai-catalog-metadata-provenance/spec.md)
defines acceptance scenarios. The [acceptance checklist](acceptance-checklist.md)
tracks planning verification; [tasks](tasks.md) is reserved for future code,
associated tests, and code documentation. File presence does not establish
implementation readiness.

## Non-Goals

- Production code, runtime provider migration, package publication, and
  creating coding stories.
- Version scheme normalization rules and original-value preservation — deferred
  to [RHIDP-18845](https://redhat.atlassian.net/browse/RHIDP-18845).
- Shared and per-kind provider SDK contracts and conformance — deferred to
  [RHIDP-18847](https://redhat.atlassian.net/browse/RHIDP-18847).
- Incremental ingestion lifecycle and responsibility split — deferred to
  [RHIDP-18846](https://redhat.atlassian.net/browse/RHIDP-18846).
- Approved recovery and safe-removal behavior — deferred to
  [RHIDP-18848](https://redhat.atlassian.net/browse/RHIDP-18848).
- Concrete provider adoption and upgrade/rollback profiles — deferred to
  [RHIDP-18849](https://redhat.atlassian.net/browse/RHIDP-18849) /
  [RHIDP-18850](https://redhat.atlassian.net/browse/RHIDP-18850).

## Capabilities

### New Capabilities

- `ai-catalog-metadata-provenance`: A metadata and provenance contract covering
  annotation semantics, kind-to-category mapping, Location entity lifecycle,
  and source correlation rules. This is a planning specification, not new
  runtime behavior.

### Modified Capabilities

None. This change specifies contracts for future adoption; it does not modify
implemented behavior.

## Canonical Touchpoints

Change type: **docs-only** planning. No canonical document updates.

- Product PRDs under `specifications/prd/`: **None** modified.
- ADRs under `specifications/adr/`: **None** modified.
- Long-lived specifications under `openspec/specs/`: **None** modified. The
  [implemented OGX specification](../../specs/ogx-entity-provider/spec.md)
  remains the release behavior reference.
- Companion specifications under `specifications/`: **None** modified. The
  existing [annotation specification](../../../specifications/annotation-specification.md)
  remains a follow-on planning reference.

## Dependencies

- **Input:**
  [RHIDP-18761](https://redhat.atlassian.net/browse/RHIDP-18761) (reconcile
  OpenSpecs for 2.2) — closed. Final artifacts must agree with its baseline.
- **Input:**
  [RHIDP-18843](https://redhat.atlassian.net/browse/RHIDP-18843) (provider
  inventory) — provides the current identity, metadata, and Location evidence
  that this change's contracts must account for.
- **Coordinate version boundary** with RHIDP-18845 (version schemes,
  original values, and normalized AI asset versions).
- **Coordinate shared/per-kind APIs** with RHIDP-18847 (shared and per-kind
  provider SDK contracts and conformance).

## Impact

- `workspaces/boost/openspec/changes/ai-catalog-metadata-provenance/` — this
  change directory (new).
- No runtime code, plugin packages, dependencies, or configuration changes.
