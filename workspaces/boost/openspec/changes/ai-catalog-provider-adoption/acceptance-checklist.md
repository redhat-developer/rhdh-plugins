# RHIDP-18843 acceptance checklist

This checklist completes the inventory, cohort, pilot, and handoff work defined
by the [proposal](proposal.md), [design](design.md), and
[planning acceptance specification](specs/ai-catalog-provider-adoption/spec.md).
The draft artifacts already exist; the items below track their evidence and
acceptance review, not a request to recreate them. Checked items record completed
planning work only. Final maintainer acceptance and merge remain separate.

Each numbered item is a bounded documentation or verification step intended to
take at most two hours. If evidence or an owner decision is unavailable, record
the blocker and required input instead of marking the item complete.

**Scope:** planning only. These checks may be marked complete when their
planning evidence, verification, or acceptance work is actually finished. They
are not implementation tasks and must not be converted into coding Jira stories.
The separate [implementation task file](tasks.md) is reserved for code, associated
tests, and documentation for that code. Merging this planning change does not
complete any future implementation task. Production migration, runtime
qualification, package publication, and code changes remain deferred.

## Canonical Touchpoints

Change type: **docs-only** planning. No canonical document updates.

- Product PRDs under `specifications/prd/`: **None** modified. RHDHPLAN-1507 and
  RHIDP-18843 define the scope.
- ADRs under `specifications/adr/`: **None** modified. Shared SDK and ingestion
  architecture decisions remain with their owning stories.
- Long-lived specifications under `openspec/specs/`: **None** modified. The
  [implemented OGX specification](../../specs/ogx-entity-provider/spec.md) remains
  the release behavior reference.

## 1. Confirm the provider inventory against its evidence

- [x] 1.1 Verify the recorded source revision and registration evidence for all
      five current provider classes in `provider-inventory.md`. Reconcile any
      intervening additions/removals explicitly; distinguish class count from
      configured instance count.
- [x] 1.2 Confirm that KServe/Kubeflow, OCI skill-image, and NPX backends are
      identified as source services with named catalog consumers; keep processors,
      mapping libraries, and archived code outside the registered-provider count.
- [x] 1.3 Review each provider's identity inputs, namespace behavior, provider
      name, mutation locationKey, spec.owner, provenance/management annotations,
      Location emission or absence, version handling, and SDK use against the linked
      code. Record identity/collision constraints without choosing new mappings.
- [x] 1.4 Review current mutation, persistence, restart, retry, and deletion
      behavior for all providers. Preserve the distinction between in-memory
      safeguards and durable ownership/pending-delta/acknowledgment state, including
      the current empty/partial/failed/ready semantics where applicable.

## 2. Resolve or explicitly disposition source-capability evidence

Start after section 1 establishes the inspected source behavior. Work within
the existing inventory and its evidence-gap records; do not implement adapters
or require live credentialed access merely to make a checkbox pass.

- [x] 2.1 For each source-capability claim needed to accept this inventory,
      record the exact claim, evidence level, source/version or inspected revision,
      affected provider/pilot decision, and closure status. Separate unverified
      external guarantees from directly observed local client behavior.
- [x] 2.2 Review the OGX model `/v1/models` request/response evidence and the
      configuration-backed agent source. Cite accessible versioned contract evidence
      for any required external OGX guarantee, or identify the precise limitation
      needing maintainer disposition. Do not infer unsupported source capabilities
      from the single-request client.
- [x] 2.3 Review the model-catalog bridge and KServe informer boundaries: list
      completeness, per-record fetch behavior, in-memory source state, and watch
      resourceVersion usage. Identify which guarantees are local bridge behavior
      and which need external source evidence or a stated limitation.
- [x] 2.4 Review MCP cursor enumeration, page/entry limits, and current failure
      handling with implementation evidence and any required versioned source
      contract. Leave unused or unverified change-feed/deletion guarantees visibly
      unverified rather than claiming either support or absence.
- [x] 2.5 Review OCI discovery pagination, the bounded snapshot contract, and
      durable skills reconciliation/retention evidence. Keep native page cursors,
      observation revisions, and artifact digests separate. Record the future
      shared-ingestion paging boundary as an explicit RHIDP-18846/RHIDP-18850 input;
      do not claim that adaptation is already implemented or tested.
- [x] 2.6 Close each required evidence item with a cited contract/response or
      an explicit maintainer-accepted limitation and owning follow-up. Keep pending
      decisions unresolved. Do not mark this story complete while a required claim
      has neither evidence nor an accepted disposition; later SDK/adapter design
      questions remain assigned to their owning stories rather than solved here.

## 3. Confirm adoption scope and validation progression

Q1/Q2, the subsequent all-provider clarification, and Q3 evidence-limit
acceptance are recorded
maintainer decisions. This section checks their propagation, not a request to
ask those questions again.

- [x] 3.1 Confirm that the initial 2.2 shipping adoption cohort is OGX model,
      OGX agent, model-catalog, and MCP-registry, with KServe as source-service
      support and no automatic OCI/NPX product-delivery commitment.
- [x] 3.2 Confirm the same explicit validation order in proposal, design,
      inventory, and specification: **OGX model smoke → OCI skills pilot →
      MCP-registry validation later → every remaining provider**. Ensure no current
      artifact identifies MCP as the pilot immediately after OGX.
- [x] 3.3 Confirm that eventual adoption/conformance coverage includes every
      entity provider across both workspaces, including SkillsCatalogProvider and
      explicitly dispositioned additions found during inventory refresh. Check
      that the initial shipping cohort and selected pilot are not permanent limits
      on coverage.
- [x] 3.4 Check that each selected validation stage has a rationale and stated
      limits. In particular, OGX smoke must not qualify multi-page recovery, and OCI
      connector discovery paging must not be presented as proof of catalog/SDK
      paging. Preserve the OCI retention/replay constraints and the later ownership
      of detailed rollout, upgrade, and rollback criteria.

## 4. Prepare the downstream planning handoff

Start after the evidence review and accepted-scope checks above; keep genuinely
future contract decisions explicit rather than turning them into 18843 work.

- [x] 4.1 Confirm ai-integrations workspace conventions, CODEOWNERS, and the
      cited upstream-tracking model/processor constraints. Ensure local tracking
      references are not described as current upstream verification or permission
      to fork a schema.
- [x] 4.2 Review the design D3 handoff table against all eight specification
      requirements. Map identity/provenance, version, lifecycle, SDK, and safety
      inputs to RHIDP-18844 through RHIDP-18848 without duplicating their contracts.
- [x] 4.3 Prepare a provider-by-provider coverage/disposition record in the
      inventory for RHIDP-18849/RHIDP-18850: initial shipping versus validation or
      reference use, existing identity/state constraints, source evidence and its
      limitations, later profile owner, and prerequisites. Include every registered
      provider; do not create a new Jira issue for each row.
- [x] 4.4 Confirm that final adoption profiles depend on accepted metadata/SDK
      and lifecycle/safety contracts. Record the later one-to-one mapping of coding
      stories to change-local x.y implementation tasks and accepted revisions;
      explicitly exclude this planning checklist from that coding-story generation.

## 5. Verify and accept the planning artifacts

- [x] 5.1 Check all 17 acceptance scenarios against the inventory, accepted
      decisions, and evidence dispositions. Record remaining gaps without claiming
      that future provider runtime tests or migrations have passed.
- [x] 5.2 Verify every changed relative link and heading fragment, consistent
      canonical touchpoints, unchanged active runtime/package/release surfaces, and
      proposal/design/specification/implementation-task scope and acceptance-checklist agreement.
      Preserve append-only journals.
- [x] 5.3 Run workspace-required formatting, OpenSpec validation, journal
      validation, and `git diff --check`; record actual results. Type/API/build and
      runtime suites are required only if later authorized changes affect those
      surfaces; do not revive archived packages to validate this planning change.
- [x] 5.4 Run the independent `openspec-audit-change` workflow against the full
      artifact set and current sibling ownership map. Record the dated audit
      findings; address agreed corrections and re-audit changed artifacts. Do not
      claim a clean audit before it runs or leave audit results stale after edits.
- [x] 5.5 Obtain maintainer acceptance of the planning handoff after unresolved
      required evidence items and blocking audit findings have dispositions. Record
      pending shared-contract/profile dependencies accurately. Commit, push, PR
      creation, and Jira lifecycle updates remain subject to later instructions.

## Acceptance evidence — 2026-11-13

The inventory baseline remains repository revision
`719a89f8061b0ee7f232451e47629d5ef60eea6e`; this branch has no runtime changes.
The port revalidates those inputs against PR #5565 source baseline
`8af3d2f4e0dbbf57b8425c688a02551f82289c4a`; package-only provider updates and
the NPX logging/test changes do not invalidate the recorded behavior.
Sections 1–4 above are documentation reviews against the linked implementation
evidence, convention files, accepted Q1/Q2 scope/order, and Q3 source-evidence
dispositions. External verification remains explicitly unperformed where stated.

| RHIDP-18843 acceptance criterion                             | Evidence / current disposition                                                                                                                                                         |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider classes, packages, boundaries, implementation links | Inventory registration and source-service sections cover all five classes and their distinct source services.                                                                          |
| Mutation/persistence and source paging/change evidence       | Inventory source and recovery sections record local behavior; source-evidence dispositions identify exact external unknowns, Q3 acceptance, follow-up owners, and later profile gates. |
| Initial shipping, reference, and deferred scope              | Design D1 and inventory cohort/coverage tables preserve accepted scope and eventual all-provider coverage.                                                                             |
| Representative pilot/order with explicit source limitations  | Design D4 and inventory pilot/disposition sections record OGX smoke → OCI pilot → MCP → all remaining providers, with limits and owners.                                               |
| Upstream-tracking ownership constraints                      | Inventory SDK/ownership section links ai-integrations conventions, CODEOWNERS, and local tracking evidence without claiming independent upstream verification.                         |
| Feed later OpenSpecs without coding stories                  | Design D3/D5, provider-by-provider handoff, and implementation-only tasks.md assign later work without generating coding stories.                                                      |

### Scenario coverage review

This is inspection of planning artifacts, not execution of future runtime tests.
The 17 scenarios are in the [planning specification](specs/ai-catalog-provider-adoption/spec.md).

| Scenario                                                 | Evidence in the planning artifacts                                                                   |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Inventory the inspected provider baseline                | Inventory baseline, five registration entries, resolving source links                                |
| Separate source services and support modules             | Source-services table and named catalog consumers                                                    |
| Reconcile changed provider discovery                     | Inventory coverage/handoff refresh rule; unchanged inspected HEAD                                    |
| Compare different version and identity models            | Inventory identity/ownership/metadata table                                                          |
| Record ownership changes as migration inputs             | Identity migration caveats and provider handoff constraints                                          |
| A client does not consume pagination or change feeds     | Source-enumeration table distinguishes local omission from external unknown                          |
| Distinguish the OCI enumeration boundaries               | Inventory OCI/snapshot rows and design D4 adaptation boundary                                        |
| Close a required capability evidence gap                 | Q3 source-evidence dispositions, owning stories, later profile gate                                  |
| Preserve differences between current recovery mechanisms | Inventory failure/restart/deletion table and SDK-use section                                         |
| Account for OCI retention before later replacement       | Inventory durable replay, catalog visibility, revision, acknowledgment, and cleanup evidence         |
| Record the initial shipping cohort                       | Design D1 and inventory cohort table                                                                 |
| Cover providers beyond the smoke path and pilot          | Design D1/D4 and all-five-provider handoff table                                                     |
| Read the agreed validation order                         | Proposal, design D4, and inventory pilot section                                                     |
| Define what the smoke path cannot establish              | Design D4 smoke limitation and inventory pilot comparison                                            |
| A provider uses an upstream-tracking entity model        | Inventory ownership section and linked conventions/tracking evidence                                 |
| Prepare later provider profiles                          | Design D3 and per-provider handoff with shared-contract/source-verification prerequisites            |
| Keep the coding-story mapping deferred                   | Design D5 and tasks.md; planning checks separate, no numbered implementation tasks or coding stories |

### Accepted-source verification — 2026-11-13

- OpenSpec validation: **16/16 items passed**.
- Formatting: all change Markdown files passed Prettier.
- Local references: **59 relative links/heading fragments resolved**, including
  the audit report reference.
- Structure: **8 requirements, 17 scenarios, 23 unique acceptance checks**;
  `tasks.md` has no numbered implementation tasks.
- Scope: tracked changes are confined to this OpenSpec change; no runtime,
  package, dependency, release, or canonical specification changes.
- Journal and whitespace checks: passed. Journal history is append-only.
- Independent source-branch OpenSpec audit: **0 CRITICAL, 0 WARNING, 0 SUGGESTION**.
  The current [audit report](audit.md) covers the port verification below.
  All required artifacts are present; apply remains blocked because implementation
  tasks are deferred. Audit completion does not imply implementation readiness.

The maintainer accepted all **23 source-branch planning checks** and the handoff, and
authorized a local commit on 2026-11-13. PR creation, push, merge, and Jira
completion remain separate; these checks do not complete future implementation
work.

### PR #5565 port verification

The source acceptance above is retained as history. Checks **5.2–5.4** were
repeated against the port and are complete. All **23 planning checks** are now
complete; the implementation-task file still contains no numbered tasks. The Fullsend journal prefix is preserved;
source-branch decisions are carried forward by explicit journal records.
Presentation changes and the RHIDP-18850 bridge-schema follow-up do not add
runtime or implementation scope. No implementation tasks have been created.

Port results (2026-11-13):

- OpenSpec validation: **16/16 items passed**; formatting passed.
- **69 local links/heading fragments** resolved.
- **8 requirements / 17 scenarios** retained; all 23 planning checks accounted for.
- Six core inventory sections are identical to the accepted source; all original
  provider registration/output/state entries were retained in the new profiles.
- `tasks.md` is identical to the accepted source and has no implementation tasks.
- Independent port audit: **0 CRITICAL, 0 WARNING, 0 SUGGESTION**.
- Journal and whitespace checks passed; original Fullsend journal records remain
  an unchanged prefix. New records identify the accepted-source port and audit.
- Changes are limited to this OpenSpec directory. The PR branch's newer main
  history, runtime packages, dependencies, and canonical specifications are intact.

The maintainer approved the port for a local commit on 2026-11-13. Signing,
push, PR merge, and Jira completion remain separate; this does not complete
future provider implementation work.
