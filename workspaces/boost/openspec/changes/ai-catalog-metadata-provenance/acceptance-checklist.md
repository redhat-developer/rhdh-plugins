# RHIDP-18844 acceptance checklist

This checklist tracks planning verification and handoff for the metadata and
provenance contract defined by the [proposal](proposal.md),
[design](design.md), and
[specification](specs/ai-catalog-metadata-provenance/spec.md). Checked items
record completed planning work only. Final maintainer acceptance and merge
remain separate.

Each numbered item is a bounded documentation or verification step. If evidence
or an owner decision is unavailable, record the blocker and required input
instead of marking the item complete.

**Scope:** planning only. These checks may be marked complete when their
planning evidence, verification, or acceptance work is actually finished. They
are not implementation tasks and must not be converted into coding Jira stories.
The separate [implementation task file](tasks.md) is reserved for code,
associated tests, and documentation for that code, with no implementation tasks
defined yet. Merging this planning change does not complete any future
implementation task. Production migration, runtime qualification, package
publication, and code changes remain deferred.

## Canonical Touchpoints

Change type: **docs-only** planning. No canonical document updates.

- Product PRDs under `specifications/prd/`: **None** modified.
- ADRs under `specifications/adr/`: **None** modified.
- Long-lived specifications under `openspec/specs/`: **None** modified. The
  [implemented OGX specification](../../specs/ogx-entity-provider/spec.md)
  remains the release behavior reference.

## 1. Confirm annotation baseline against implementation evidence

- [x] 1.1 Verify that the three `rhdh.io/ai-asset-*` annotations are documented
      with meanings, required/optional rules, validation behavior, and examples
      grounded in current code (`ai-catalog-entity-provider-sdk/src/annotations.ts`,
      `validateAIAssetEntity.ts`).
- [x] 1.2 Verify that the six accepted category values match the SDK's
      `AIAssetCategorySchema` and the annotation-scheme spec.
- [x] 1.3 Confirm that version annotation requirements defer normalization
      rules to RHIDP-18845 and reference the existing SDK normalizer only as
      current behavior.
- [x] 1.4 Confirm that source annotation safe-exposure rules exclude
      credentials, raw internal URLs, and PII, with provenance examples using
      only connector names and app-config instance identifiers.

## 2. Confirm kind/spec.type to category mapping

- [x] 2.1 Verify the mapping table against `AI_ASSET_SPEC_TYPES` in
      `ai-catalog-common/src/aiAssetTaxonomy.ts` and Decision 1 in
      `ai-catalog-entity-model/design.md`.
- [x] 2.2 Confirm that `vector-store`, `ai-tool`, and `skill-bundle` are
      excluded from the active mapping per RHIDP-18761 reconciliation.
- [x] 2.3 Confirm the `ai-model` category documents `kind: Resource`,
      `spec.type: ai-model` as not yet in the taxonomy because no active
      provider emits it.
- [x] 2.4 Verify the precedence rule: annotation is authoritative for
      classification, kind/`spec.type` is the structural mapping.

## 3. Confirm Location entity specification against inventory evidence

- [x] 3.1 Verify that the design documents no current provider emits Location
      entities, citing the RHIDP-18843 inventory.
- [x] 3.2 Verify the management annotation current-behavior table matches the
      five providers in the RHIDP-18843 inventory.
- [x] 3.3 Confirm the proposed Location entity contract defines granularity,
      stable identity, type/target semantics, asset correlation, ownership,
      and deletion lifecycle.
- [x] 3.4 Confirm that the Location entity contract distinguishes a catalog
      Location entity, `backstage.io/managed-by-location` /
      `backstage.io/managed-by-origin-location` annotations, and the mutation
      `locationKey` parameter.
- [x] 3.5 Confirm that the contract accounts for API-origin sources versus
      catalog descriptor file URLs.

## 4. Confirm edge-case and provenance scenarios

- [x] 4.1 Verify scenarios cover conflicting metadata (multiple providers,
      same entity identity, different annotation values).
- [x] 4.2 Verify scenarios cover missing source data (no version, unknown
      category).
- [x] 4.3 Verify scenarios cover multi-instance sources (shared source,
      distinct sources, `locationKey` scoping).
- [x] 4.4 Verify provenance examples are credential-free and define safe
      exposure rules.
- [x] 4.5 Verify that duplicate ingestion prevention relies on deterministic
      naming and `locationKey` scoping.

## 5. Confirm scope boundaries and deferrals

- [x] 5.1 Confirm version scheme normalization is deferred to RHIDP-18845.
- [x] 5.2 Confirm shared/per-kind SDK contracts are deferred to RHIDP-18847.
- [x] 5.3 Confirm incremental ingestion lifecycle is deferred to RHIDP-18846.
- [x] 5.4 Confirm recovery and safe-removal behavior is deferred to RHIDP-18848.
- [x] 5.5 Confirm no production code, runtime migration, package publication,
      or coding stories are included.

## 6. Confirm frontend feedback status

- [x] 6.1 Verify the working baseline is labeled provisional and not
      described as stakeholder-approved.
- [x] 6.2 Verify that outstanding frontend review questions are recorded with
      recommendations.
- [x] 6.3 Verify that changes to the working baseline require explicit
      frontend review before implementation.

## 7. Verify artifact quality

- [ ] 7.1 Run OpenSpec validation (`yarn openspec:validate`) and record results.
- [ ] 7.2 Run Prettier formatting check and record results.
- [ ] 7.3 Verify all relative links and heading fragments resolve to existing
      files and sections.
- [ ] 7.4 Verify journal is append-only and records this change's authoring.
- [ ] 7.5 Run independent artifact audit and record findings.
