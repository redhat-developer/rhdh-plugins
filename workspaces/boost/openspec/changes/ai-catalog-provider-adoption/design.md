# Design: AI Catalog Provider Adoption

## Context

[RHIDP-18843](https://redhat.atlassian.net/browse/RHIDP-18843) establishes the
inventory, adoption cohort, and pilot inputs for RHIDP-18841. The
[proposal](proposal.md) defines this planning scope; the
[provider inventory](provider-inventory.md) records the inspected implementation
and its evidence limits.

The inventory distinguishes five catalog EntityProvider classes from three
backend source services. Four providers currently submit full mutations; the
skills provider instead has durable source-scoped delta reconciliation and OCI
retention acknowledgments. These mechanisms are not evidence that any provider
has adopted Backstage incremental ingestion or the complete future 1507 SDK.

The maintainer accepted the adoption cohort in grill-me Q1 and selected OGX model
smoke followed by an OCI skills validation pilot in Q2. OCI remains outside the
2.2 shipping cohort. The story must not be described as complete while required
source-capability evidence or its explicit limitation/ownership disposition
remains unresolved.

## Canonical Touchpoints

Change type: **docs-only** planning. No canonical document updates.

- Product PRDs under `specifications/prd/`: **None** modified. The current
  [RHDHPLAN-1507](https://redhat.atlassian.net/browse/RHDHPLAN-1507) issue and
  RHIDP-18843 provide the scope.
- ADRs under `specifications/adr/`: **None** modified. This change does not decide
  the shared SDK or ingestion architecture.
- Long-lived specifications under `openspec/specs/`: **None** modified. The
  [implemented OGX specification](../../specs/ogx-entity-provider/spec.md) remains
  the Boost release behavior reference. Describing an adoption candidate or
  observed limitation does not change implemented release behavior.

## Goals / Non-Goals

**Goals:**

- Make current provider/source boundaries and source capabilities reviewable
  through a single evidence inventory.
- Record the initial shipping cohort and eventual adoption/conformance coverage
  for **all catalog entity providers across Boost and ai-integrations**, without
  promoting experimental skills work into RHDH 2.2 product scope.
- Select a pilot and proposed progression based on demonstrated source behavior,
  identity/ownership constraints, and recovery complexity.
- Identify evidence gaps and later contract owners before provider-specific
  adoption specifications are written.

**Non-Goals:**

- Production code, configuration rollout, catalog mutation, or package release.
- New metadata/Location/version schemas, public SDK APIs, or an ingestion engine.
- Fixing every reliability limitation discovered while inventorying providers.
- Changing source-service plugins into catalog entity providers.
- Selecting an OCI product, shipping reference-only OCI/NPX work, or reviving
  historical graph/bundle/provider contracts.
- Creating coding Jira stories or claiming runtime qualification or external
  architect/frontend approval.

## Decisions

### D1: Preserve the maintainer-selected provider/source boundary

**Status: Accepted in grill-me Q1, 2026-11-12.**

The RHDH 2.2 adoption planning cohort is:

1. Boost `OgxModelEntityProvider`.
2. Boost `OgxAgentEntityProvider`.
3. ai-integrations `ModelCatalogResourceEntityProvider`.
4. ai-integrations `McpRegistryEntityProvider`.

KServe/Kubeflow remains a supporting source service. Consider source-protocol
changes only when its catalog consumer requires them under the accepted shared
contracts. SkillsCatalogProvider, OCI/NPX source services, and skills helper
contracts remain outside the 2.2 shipping cohort. The OCI skills path is selected
as the validation pilot in D4; NPX remains reference-only. This selection does
not convert either source service into a catalog provider.

**Eventual coverage is all catalog entity providers across both workspaces**,
not only the initial cohort or selected pilot. This includes all five currently
inventoried classes, including SkillsCatalogProvider. Recheck the inventory as
providers are added or changed so none is silently omitted. Supporting source
services remain distinct from providers. Eventual adoption/conformance coverage
does not imply that every experimental source ships in RHDH 2.2.

**Rationale:** Catalog ownership belongs to the actual registered providers.
Source acquisition, normalization, and retained content can have separate owners
and lifecycles. Their existence does not create additional catalog providers.

**Alternatives considered:** Treat every backend plugin as an adopter, which
would blur these ownership boundaries; or include all skills implementations in
2.2, which would expand the agreed release scope. Neither is the selected plan.

### D2: Keep evidence and capability claims separate

**Status: Evidence limits accepted for inventory purposes in grill-me Q3,
2026-11-13.**

The inventory is the current-behavior evidence record. Each provider profile
identifies registration/configuration, entity identity, mutation ownership,
metadata/version handling, consumed source protocol, mutation mode, state and
restart behavior, and upstream ownership constraints. Backend source services
are described separately.

Distinguish local client behavior from externally verified source guarantees.
For example, MCP's consumed page cursor is observed; a deployed registry's
change-feed guarantees need separate evidence. A source's lack of a consumed
cursor is not evidence that the source cannot paginate.

Record external verification gaps with the evidence needed to close them and
the affected adoption decision. Before declaring this story complete, resolve
the selected cohort/pilot's required source-capability claims with versioned
contract or deployment evidence, or document a maintainer-accepted limitation
and owning follow-up. Do not silently turn an unknown into a supported feature.

The maintainer accepted the specific OGX, KServe/bridge, MCP, and OCI limits in
the inventory's [source-evidence disposition record](provider-inventory.md#source-evidence-dispositions).
RHIDP-18849 owns OGX follow-up and RHIDP-18850 owns ai-integrations follow-up,
coordinating lifecycle and safety decisions with RHIDP-18846/RHIDP-18848.
Before accepting a later adoption profile, obtain evidence for each guarantee
it relies on or define an accepted safe limitation. This inventory acceptance
does not approve current failure/deletion behavior, prove source completeness,
or qualify a provider for migration.

**Rationale:** A source inventory should constrain later architecture without
pretending to have verified every upstream API or runtime deployment.

**Alternative considered:** A single supported/unsupported flag per source.
That would conflate client omissions, upstream capability, and product support.

### D3: Reuse the inventory as input to later contracts and profiles

**Status: Authoring boundary for this draft.**

Keep the inspected facts in `provider-inventory.md`; later profiles refer to
them and state any verified changes rather than copying conflicting snapshots.
Evidence is pinned to the inspected revision. Refresh affected rows when source
changes invalidate a claim before specification acceptance.

| Owning story              | Input from this inventory                                                                         | Decision left to that story                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| RHIDP-18844               | Current identity, provenance, missing/generated annotations, absence of emitted Location entities | Metadata and Location correlation/lifecycle contract               |
| RHIDP-18845               | Source/native version fields, hash/digest fallbacks, versioned versus unversioned identities      | Version scheme, original value, normalization, comparison contract |
| RHIDP-18846               | Full/delta modes, source paging/watch protocols, in-memory versus durable state                   | Backstage incremental lifecycle and responsibility split           |
| RHIDP-18847               | Actual SDK imports and provider-specific responsibilities                                         | Shared/per-kind API, validation, packaging, conformance            |
| RHIDP-18848               | Empty/partial responses, restart, replay, deletion and ownership hazards                          | Approved recovery and safe-removal behavior                        |
| RHIDP-18849 / RHIDP-18850 | Cohort, source capabilities, identity/state boundaries, pilot decision                            | Concrete provider adoption and upgrade/rollback profiles           |

The skills retention protocol is a reference case the shared design must account
for, not an automatic requirement to add OCI acknowledgment APIs to every SDK.
Likewise, existing in-memory safety gaps are inputs to the safety design, not
accepted behavior for the eventual migration.

RHIDP-18850 must verify the model-catalog bridge response and field semantics
against its consumed `@redhat-ai-dev/model-catalog-types` contract before
specifying provider adaptation. Preserve the current evidence and coordinate
metadata/version decisions with RHIDP-18844/RHIDP-18845; this does not select a
replacement bridge API or make SDK adoption choices in this story.

**Alternative considered:** Specify SDK APIs and conversion steps immediately in 18843. That would preempt the metadata and ingestion stories on which the
provider adoption profiles depend.

### D4: Validate OGX first, OCI skills second, and MCP later

**Status: Accepted in grill-me Q2 and clarified by the maintainer, 2026-11-12.**

The selected order is:

1. **OGX model smoke** — a simple first adoption path.
2. **OCI skills pilot** — the representative pilot, selected because the
   maintainer knows this implementation and it offers pagination/recovery cases.
3. **MCP-registry validation later** — a follow-on exercise after OCI, not the
   pilot immediately after OGX.
4. **Complete coverage of every remaining entity provider across Boost and
   ai-integrations.** The sequence above is the starting order, not the total
   scope. This includes OGX agents and model-catalog/KServe consumer profiles;
   SkillsCatalogProvider is exercised through the OCI pilot and remains part
   of eventual shared-contract adoption/conformance coverage.

All stages depend on accepted shared contracts and the relevant provider
profiles; no implementation starts in this story. The OCI pilot does not add
OCI or NPX sources to RHDH 2.2 product delivery.

| Selected stage              | Purpose                                                                                                                                            | Limitation / exit evidence to define later                                                                                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. OGX model smoke          | Check basic SDK metadata/adapter wiring with one aggregate model-server entity                                                                     | Preserve identity/ownership or require an explicit migration plan. This path cannot qualify multi-page or interrupted-scan safety.                                                     |
| 2. OCI skills pilot         | Exercise SkillsCatalogProvider plus the skill-image connector, native discovery paging, partial snapshots, durable recovery, and content retention | Define where pagination exercises the approved shared ingestion lifecycle. Preserve existing identity, replay, catalog visibility, and retention safeguards.                           |
| 3. MCP-registry later       | Exercise its distinct cursor paging, versioned identities, scan limits, and source-failure cases after OCI                                         | Validate MCP-specific behavior rather than treating the OCI pilot as proof that all source protocols are equivalent.                                                                   |
| 4. Every remaining provider | Complete adoption/conformance coverage for OGX agents and model-catalog, and reconcile any additional providers discovered in either workspace     | Maintain a provider-by-provider coverage record. Profiles define detailed upgrade/rollback and source-service coordination; no provider is excluded just because it was not the pilot. |

The OCI path has two separate enumeration boundaries today: the connector pages
Quay discovery, while SkillsCatalogProvider makes one bounded snapshot request.
Native discovery paging alone does not establish that catalog-provider paging,
bursts, or checkpoints have been exercised. RHIDP-18846 and RHIDP-18850 must
specify the pilot's source-service/catalog-provider adaptation and verification
boundary. Do not invent a new page API, expose source cursors as SDK cursors,
or relabel the current snapshot consumer as already incremental.

The pilot must account for the snapshot's partial/ready distinction and size
bounds, durable pending deltas, processed-catalog visibility, and OCI content
acknowledgments described in the inventory. Deletion/recovery outcomes remain
owned by RHIDP-18848. No new claim of live-source verification is made here.

**Rationale:** OGX offers a small smoke path; the familiar OCI implementation
provides the selected pilot's pagination and recovery cases; MCP then checks a
different source protocol. Completing the remaining profiles prevents those
examples from becoming a permanent limit on coverage. Product shipping and
experimental validation remain separate dimensions.

### D5: Distinguish planning acceptance from implementation acceptance

**Status: Authoring boundary for this draft.**

The [behavioral specification](specs/ai-catalog-provider-adoption/spec.md)
defines acceptance for the inventory, cohort, pilot decision, evidence limits,
and downstream handoff. It must not claim that providers have migrated or that
future runtime scenarios already pass.

The [acceptance checklist](acceptance-checklist.md) tracks this story's planning
evidence, verification, and maintainer acceptance. Mark those checks complete
when their work is verified; their IDs are not coding-story inputs.

[tasks.md](tasks.md) is reserved for code that delivers this change's
RHDHPLAN-1507 functionality, associated automated tests, and documentation for
that code. No numbered implementation tasks are defined in this inventory
stage. Stories under RHIDP-18839/RHIDP-18840 develop shared-contract tasks in
their relevant changes; RHIDP-18849/RHIDP-18850 under RHIDP-18841 refine this
change's provider adoption tasks using the accepted contracts.

Create coding Jira stories only after the corresponding final provider and
shared-contract specifications are accepted. Each coding story maps to one
specific change-local `x.y` implementation task and accepted revision, and every
in-scope task maps to one story. Those implementation tasks remain unchecked
through planning merges and are completed only after their implementation and
required verification. No coding stories are created here.

**Alternative considered:** Generate coding stories from the inventory now.
That would freeze work before the shared contracts and source limitations have
been resolved.

## Risks / Trade-offs

- **Inspection drift:** provider code changes after the recorded revision →
  refresh affected evidence before accepting a profile; preserve the revision
  and distinguish later verification from the original observation.
- **Scope promotion:** rich experimental skills behavior looks ready to reuse →
  retain D1's reference-only boundary and require explicit release approval for
  any change to that cohort.
- **Incomplete source evidence:** client behavior is mistaken for upstream
  capability → use D2's evidence levels and explicit closure records.
- **False pilot confidence:** one-entity success is treated as incremental
  ingestion qualification → keep the smoke path and representative pilot's
  goals distinct, with the approved safety contract defining verification.
- **Premature architecture:** the inventory dictates an adapter API or deletion
  policy → assign those decisions to D3's owning stories.
- **Hidden identity migration:** source, provider, namespace, or version changes
  are treated as cosmetic → carry the inventory's identity and persisted-state
  constraints into each provider's reviewed migration profile.

## Migration Plan

This story has no runtime migration, deployment, rollback operation, or package
publication. It prepares their inputs.

The planning progression is: accept the cohort and pilot decision; close or
explicitly accept the necessary source-evidence limitations; agree the shared
metadata/SDK and lifecycle/safety contracts; complete RHIDP-18849/18850 adoption
profiles; then create implementation stories from accepted numbered tasks.
Documentation correction is the recovery action if new evidence invalidates a
claim; it is not permission to alter live catalog entities.

## Open Questions

1. **OCI pilot pagination boundary:** how will native OCI discovery paging and
   the currently bounded snapshot consumer exercise the approved shared
   ingestion lifecycle? RHIDP-18846 and RHIDP-18850 own the adaptation design;
   this is an explicit pilot prerequisite, not an unrecorded assumption.
2. **Source-capability follow-up:** broader upstream/deployment guarantees remain
   unverified as recorded in the inventory. Q3 accepts these limits for this
   inventory only. RHIDP-18849/RHIDP-18850 must obtain evidence or define accepted
   safe limitations for relied-on guarantees before profile acceptance.
3. **Detailed rollout and qualification:** exact order after the smoke/pilot,
   runtime compatibility, safe-removal policies, upgrade/rollback behavior, and
   test environments belong to the later owning stories in D3. Their absence is
   not permission to invent those contracts here.
