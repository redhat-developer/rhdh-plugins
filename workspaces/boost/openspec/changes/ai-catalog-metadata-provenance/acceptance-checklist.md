# RHIDP-18844 acceptance checklist

This checklist records planning evidence for the [proposal](proposal.md),
[design](design.md), and [specification](specs/ai-catalog-metadata-provenance/spec.md).
Checked items establish completed documentation/verification work only. Final
maintainer acceptance and merge remain separate. Frontend presentation approval
and runtime qualification are not implied.

The separate [tasks.md](tasks.md) remains reserved for future code, associated
tests, and documentation for that code. It defines no implementation tasks yet;
merging this planning change completes none. No production code, provider
migration, publication, or coding stories are included.

## Canonical Touchpoints

Change type: **docs-only** planning. No canonical document updates.

- Product PRDs under `specifications/prd/`: **None** modified.
- ADRs under `specifications/adr/`: **None** modified.
- Long-lived specifications under `openspec/specs/`: **None** modified. The
  [implemented OGX specification](../../specs/ogx-entity-provider/spec.md)
  remains the release behavior reference.

## Acceptance-criteria evidence

| RHIDP-18844 criterion                                                                | Planning evidence                                                                                                                                                         |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Annotation meanings, required/optional behavior, validation, examples                | Design Decisions 1–3; spec existing annotation requirements and added source-correlation scenarios. Current validation is distinguished from future reference validation. |
| Known native kind/type and semantic category mappings                                | Design Decision 2 and spec mapping scenarios; native representations retained, no generic classifier or closest-category fallback.                                        |
| Location granularity, stable identity, spec shape, correlation, ownership, lifecycle | Design Decisions 3–5; spec targetless Location, separate ingestion-path, namespace, empty/unavailable source scenarios, and deferred retirement boundary.                 |
| Conflicts, missing data, multiple instances, duplicate-ingestion prevention          | Design Decision 5 and spec ownership/full-mutation, missing version/source, and deterministic-identity scenarios.                                                         |
| Pending frontend feedback and recommendations                                        | Design Decision 7 explicitly separates accepted source semantics from provisional filtering/presentation recommendations.                                                 |
| Credential-free examples and exposure policy                                         | Design Decision 3 paired metadata example; spec safe-exposure scenarios, including optional service links and diagnostics.                                                |

## 1. Confirm annotation baseline against implementation evidence

- [x] 1.1 Verify all three AI asset annotations have meanings, required rules,
      validation behavior, and examples separating current SDK presence checks
      from the future canonical Location-reference contract.
- [x] 1.2 Verify the five minimum categories plus `rule` compatibility match
      `AIAssetCategorySchema` and the inherited annotation-scheme contract.
- [x] 1.3 Confirm version normalization is deferred to RHIDP-18845 and the
      existing `0.0.0-unknown` fallback is attributed to inherited behavior.
- [x] 1.4 Confirm source identity is credential-free; optional links and
      diagnostics exclude secrets without a blanket internal-URL prohibition.

## 2. Confirm native kind/type and category mappings

- [x] 2.1 Verify the mapping reference against `AI_ASSET_SPEC_TYPES` and
      entity-model Decision 1, retaining permitted connector-domain variations.
- [x] 2.2 Confirm retired taxonomy categories and bundle/graph scope are not
      reintroduced.
- [x] 2.3 Confirm `Resource` / `ai-model` is a future reference outside the
      current browse taxonomy, with no active provider claimed to emit it.
- [x] 2.4 Confirm the document states actual enum/presence validation and
      kind/type filtering; it invents no mismatch rejection/warning, generic
      classification fallback, or frontend precedence decision.

## 3. Confirm source Location specification against evidence

- [x] 3.1 Confirm the inventory records no current provider-emitted source
      Locations; adoption is future behavior.
- [x] 3.2 Verify the current management-annotation table against the five
      provider classes in the RHIDP-18843 inventory.
- [x] 3.3 Confirm required Locations are scoped to actual logical sources and
      ingestion paths, including multiple sources per provider, proxy/config/
      descriptor distinctions, stable identity, and configured empty sources.
- [x] 3.4 Confirm canonical source entity references, Backstage management
      location references, provider mutation scope, and conflict locationKeys
      are separate concepts with no assumed native Location `spec.owner`.
- [x] 3.5 Confirm `spec: {}` and no type/targets follow the documented minimal
      Location shape; no custom reader, manual Location registration, or
      automatic sibling-asset deletion is claimed.

## 4. Confirm edge cases and provenance scenarios

- [x] 4.1 Verify conflicting ownership keys cannot silently overwrite the
      existing entity's source/version metadata.
- [x] 4.2 Verify missing version/source annotations, invalid references,
      missing/mismatched correlation, and unresolved Location lookup are covered.
- [x] 4.3 Verify multi-source/provider, namespace differences, complete
      provider mutation scope, and known-versus-hidden proxy origins are covered.
- [x] 4.4 Verify paired provenance examples and optional links are
      credential-free and leave authentication in backend configuration.
- [x] 4.5 Verify deterministic identity and explicit ownership replace false
      automatic-merge, per-locationKey-bucket, and cross-catalog deduplication claims.

## 5. Confirm scope boundaries and deferrals

- [x] 5.1 Version scheme/normalization/original-value decisions remain RHIDP-18845.
- [x] 5.2 SDK APIs, validation routing, and conformance remain RHIDP-18847.
- [x] 5.3 Incremental lifecycle and reconciliation remain RHIDP-18846.
- [x] 5.4 Recovery/safe removal remain RHIDP-18848; source-record retention
      does not establish asset deletion policy.
- [x] 5.5 Provider profiles remain RHIDP-18849/18850; no TypeScript,
      runtime migration, publication, implementation tasks, or coding Jiras added.

## 6. Confirm frontend feedback status

- [x] 6.1 Distinguish maintainer-accepted source semantics from pending
      frontend stakeholder agreement.
- [x] 6.2 Record provisional recommendations for filtering, source Location
      navigation, and optional service-link display.
- [x] 6.3 Preserve current browse behavior and require frontend agreement
      and separate scope before changing presentation/filtering.

## 7. Verify artifact quality

- [x] 7.1 Run `yarn openspec:validate` and record results.
- [x] 7.2 Run targeted Prettier and whitespace checks and record results.
- [x] 7.3 Resolve local file links and heading fragments.
- [x] 7.4 Verify journal history is preserved and newly appended entries are
      valid; disclose inherited journal validation defects separately.
- [x] 7.5 Run a fresh independent cross-artifact audit and record its findings.

## Accepted review decisions — 2026-11-16

The maintainer confirmed shared understanding after reviewing each point:

- Each integration knows the records it retrieves and the mapping it emits;
  no generic classifier, guessed category, or new skip policy is required.
- Providers emit and own targetless source Locations (`spec: {}`), following
  Backstage's documented shape; no passive custom target reader is required.
- Multiple Locations reflect actual logical sources/ingestion paths. OGX model
  API discovery, configured agents, and descriptor imports are distinct;
  unknown remotes behind a proxy are not fabricated.
- Keep a source Location while its source is configured, including empty
  results, first-fetch failures, and temporary outages. Retirement mechanics
  remain deferred.
- Correlation uses credential-free canonical entity references. Optional
  credential-free service links may include internal URLs appropriate for the
  catalog audience and normal visibility policy.

The earlier accepted equality remains:
`asset.rhdh.io/ai-asset-source = Location.rhdh.io/ai-source-ref = canonicalEntityRef(Location)`.
Location records do not acquire AI asset category/version requirements.

## Verification record

Fresh verification of the reconciled artifacts:

- `yarn openspec:validate`: **17/17 items passed**. The CLI reports all four
  planning artifacts present/complete. Apply remains intentionally blocked with
  zero implementation tasks; no implementation readiness is claimed.
- Local links: **20 file/heading references resolved** after the audit corrections.
- The original three journal records are byte-for-byte preserved; newly
  appended records satisfy the helper event/field/length contract.
- `tasks.md` and all 171 unrelated untracked files are unchanged.
- Targeted Prettier (all change Markdown and metadata YAML) and `git diff --check`: **passed**.
- The fresh independent audit checked all A–H categories and ten sibling
  changes: **0 CRITICAL, 0 WARNING, 0 SUGGESTION** after reconciliation. See
  `audit.md`. The first pass's scenario-step and RHOAI handoff findings are
  resolved; no new runtime policy was selected.
- The paired YAML example passed Backstage Location schema and canonical
  correlation checks, including empty spec and valid management references.

Historical focused source-correlation checks preceded the targetless-Location
decision and are not used as evidence for this revision.

The initial Fullsend journal records are preserved verbatim: line 2 has an
output longer than the helper's 200-character limit; line 3 lacks the required
`note` for `verifier.result`. The helper's whole-journal `doctor` therefore
cannot pass. New records must satisfy the current helper contract; no historical
verifier success is used as evidence of a clean current audit.
