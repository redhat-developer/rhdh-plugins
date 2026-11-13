# Provider adoption planning acceptance

This capability defines acceptance for RHIDP-18843's inventory and adoption plan.
Its scenarios verify the planning artifacts against implementation evidence;
they do not assert that provider migrations or future runtime tests have run.
The [design](../../design.md) records the decision rationale, and
[provider-inventory.md](../../provider-inventory.md) contains the current-source
evidence. No long-lived runtime capability is modified by this planning stage.

## ADDED Requirements

### Requirement: Evidence-backed provider and source-service inventory

The adoption plan MUST inventory every active catalog entity provider class
across Boost and ai-integrations at a recorded repository revision. Each entry
MUST identify its package/class, registration, instance configuration, emitted
kinds/types, SDK use, and implementation evidence. It MUST distinguish provider
classes from configured instances, source services, processors, mapping
libraries, commented-out code, and archived packages, as described in design D1
and D2.

#### Scenario: Inventory the inspected provider baseline

- **WHEN** the inventory is checked against the recorded inspection revision
- **THEN** it identifies OgxModelEntityProvider, OgxAgentEntityProvider,
  ModelCatalogResourceEntityProvider, McpRegistryEntityProvider, and
  SkillsCatalogProvider as five active local provider classes
- **AND** each class has a registration/configuration entry and a resolving
  implementation-evidence reference

#### Scenario: Separate source services and support modules

- **WHEN** the inventory classifies the KServe/Kubeflow, OCI skill-image, and NPX
  backend plugins
- **THEN** it identifies them as source services rather than additional catalog
  entity provider classes
- **AND** it identifies their consuming catalog provider
- **AND** processors, mapping libraries, and archived packages are recorded
  separately from registered provider classes

#### Scenario: Reconcile changed provider discovery

- **WHEN** a provider is added, removed, or materially changed after the recorded
  inspection revision and before the adoption plan is accepted
- **THEN** the inventory records the affected provider and refreshed evidence
  revision
- **AND** its coverage/cohort disposition is explicit rather than inferred from
  the original five-class count

### Requirement: Identity and ownership evidence

For each provider, the inventory MUST record current entity identity inputs,
namespace behavior, provider naming, mutation locationKey construction,
provenance annotations, emitted Location entities or their absence, version
handling, mutation mode, and state/restart behavior. It MUST distinguish these
mechanisms and identify observed collision or migration constraints without
selecting replacement contracts owned by later stories.

#### Scenario: Compare different version and identity models

- **WHEN** the current OGX, MCP-registry, and skills identity profiles are
  reviewed
- **THEN** the inventory records that OGX's fixed model-server name excludes the
  asset version, MCP identity includes the raw server version, and skills names
  derive from source identity and record key rather than artifact digest
- **AND** it records the mutation ownership keys separately from management
  annotations and spec.owner
- **AND** the absence of emitted Location entities is not described as an
  absence of provenance annotations

#### Scenario: Record ownership changes as migration inputs

- **WHEN** a profile identifies provider/source ID, namespace, name, or version
  inputs that affect identity or persisted state
- **THEN** it records which entity reference, ownership partition, or state
  namespace changes
- **AND** it identifies the later provider adoption profile as the owner of the
  corresponding upgrade/rollback decision

### Requirement: Source capability claims reflect their evidence

The inventory MUST distinguish consumed client behavior, externally verified
source guarantees, and unverified capabilities. For each source it MUST record
the actual request/configuration path, paging/change-feed inputs consumed,
completeness limits, and associated evidence. Missing local support MUST NOT be
reported as proof that the source cannot provide that capability.

The Q3 dispositions in the inventory accept the named external evidence limits
for this inventory stage only. Before accepting a later adoption profile, each
source guarantee it relies on MUST have supporting evidence or an accepted safe
limitation. Inventory acceptance MUST NOT be presented as approval of current
failure/deletion behavior or qualification for migration.

#### Scenario: A client does not consume pagination or change feeds

- **WHEN** the inspected client issues a single request or reads configuration
  without a continuation/change-feed loop
- **THEN** the inventory records that observed behavior
- **AND** broader source pagination/change-feed capability is marked unverified
  unless separate contract or deployment evidence is cited

#### Scenario: Distinguish the OCI enumeration boundaries

- **WHEN** the OCI skills pilot's pagination evidence is reviewed
- **THEN** the inventory identifies native Quay discovery paging inside the
  source connector separately from the catalog provider's single bounded
  snapshot request
- **AND** it records the snapshot completeness/status and size limits
- **AND** the shared-ingestion adaptation/verification boundary is assigned to
  RHIDP-18846 and RHIDP-18850 rather than recorded as already implemented

#### Scenario: Close a required capability evidence gap

- **WHEN** acceptance depends on a source guarantee that has not been verified
- **THEN** the plan identifies the missing guarantee, required evidence, and
  affected adoption decision
- **AND** the acceptance record contains either the supporting versioned
  contract/deployment evidence or an explicit maintainer-accepted limitation and
  owning follow-up
- **AND** an unresolved item remains visibly unresolved until that disposition
  is recorded

### Requirement: Recovery and deletion constraints remain visible

The inventory MUST record observed full/delta mutation, persistence, retry,
restart, incomplete-enumeration, and deletion behavior for each provider. It MUST
identify existing safety limitations as inputs to RHIDP-18848 and the provider
profiles, not as fixes delivered by this story or accepted future behavior.

#### Scenario: Preserve differences between current recovery mechanisms

- **WHEN** the full-mutation providers and SkillsCatalogProvider are compared
- **THEN** the inventory distinguishes in-memory last-good/paging state from
  durable pending-delta and ownership state
- **AND** it records the consequences of empty, failed, partial, and ready
  observations where those concepts exist in the inspected protocol
- **AND** restart limitations and observed risks have explicit downstream
  contract/profile owners

#### Scenario: Account for OCI retention before later replacement

- **WHEN** the OCI skills pilot is prepared for later adoption design
- **THEN** its profile inputs include durable delta replay, processed-catalog
  visibility checks, OCI revision acknowledgments, and retained-content cleanup
  ownership
- **AND** it distinguishes artifact digests, observation revisions, and source
  paging cursors
- **AND** no existing safeguard is marked replaced or verified by this
  documentation-only change

### Requirement: Initial shipping cohort and eventual coverage are distinct

The plan MUST record the accepted initial RHDH 2.2 adoption cohort separately
from experimental validation and the eventual goal of adoption/conformance
coverage for every entity provider across Boost and ai-integrations. Pilot
selection MUST NOT permanently exclude other providers or silently change
product shipping commitments.

#### Scenario: Record the initial shipping cohort

- **WHEN** the plan's release scope is reviewed
- **THEN** the initial adoption cohort names OGX model, OGX agent, model-catalog,
  and MCP-registry providers
- **AND** KServe/Kubeflow remains a supporting source service
- **AND** the selected OCI pilot is outside the initial 2.2 shipping cohort
- **AND** NPX remains a reference input for this stage

#### Scenario: Cover providers beyond the smoke path and pilot

- **WHEN** the eventual adoption/conformance scope is evaluated
- **THEN** it includes every currently inventoried provider class in both
  workspaces, including SkillsCatalogProvider
- **AND** it includes a coverage disposition for additional providers discovered
  during inventory refresh
- **AND** the plan does not use absence from the initial shipping cohort or
  selected pilot as a permanent exclusion from eventual provider coverage

### Requirement: Validation follows the maintainer-selected progression

The plan MUST specify OGX model smoke first, OCI skills as the representative
pilot second, MCP-registry validation later, and coverage of all remaining
providers. It MUST explain the distinct purpose and limitations of each stage.
This is a validation progression; detailed provider deployment and rollback
steps remain owned by RHIDP-18849/RHIDP-18850.

#### Scenario: Read the agreed validation order

- **WHEN** the selected sequence is read from the proposal, design, and inventory
- **THEN** all three identify OGX model smoke before OCI skills pilot and
  MCP-registry validation after OCI
- **AND** all three state eventual coverage of all entity providers across both
  workspaces
- **AND** MCP is not identified as the pilot immediately following OGX

#### Scenario: Define what the smoke path cannot establish

- **WHEN** the OGX model smoke path is used as an input to later qualification
  design
- **THEN** the plan identifies its limited source-enumeration complexity
- **AND** it does not treat one aggregate model-server entity as evidence of
  multi-page, interrupted-scan, or all-provider recovery qualification

### Requirement: Respect upstream and workspace ownership

The inventory and handoff MUST identify relevant workspace conventions,
upstream-tracking model/processor constraints, and review ownership before
proposing provider API or schema changes. Local tracking references MUST NOT be
represented as independent verification of an upstream change's current status.

#### Scenario: A provider uses an upstream-tracking entity model

- **WHEN** its adoption profile inputs are reviewed
- **THEN** the inventory identifies the relevant model/processor package,
  documented tracking reference, and workspace ownership/conventions
- **AND** proposed future changes are assigned to a coordinated adoption profile
  rather than implemented as a local schema fork in this story

### Requirement: Handoff preserves story and artifact boundaries

The plan MUST identify which facts and open issues feed the metadata, version,
incremental lifecycle, SDK, safety, and provider-specific stories listed in
design D3. It MUST preserve the separation between reviewed planning,
implementation-ready contracts, and completed runtime behavior. No coding Jira
stories or production migrations are delivered by RHIDP-18843.

`tasks.md` MUST contain only implementation items for code delivering this
change's RHDHPLAN-1507 functionality, associated automated tests, and
documentation for that code. Planning checks MUST be tracked separately in
`acceptance-checklist.md`. No numbered implementation tasks are defined in this
inventory stage; later contract and provider-adoption stories refine the tasks
before coding-story creation.

#### Scenario: Prepare later provider profiles

- **WHEN** the inventory and plan are handed to RHIDP-18849 or RHIDP-18850
- **THEN** the handoff includes the accepted cohort/order, applicable source
  evidence, identity/ownership constraints, recovery limitations, and outstanding
  items with owning stories
- **AND** final profile acceptance depends on the relevant accepted shared
  metadata/SDK and lifecycle/safety contracts
- **AND** source guarantees relied on by the profile have supporting evidence
  or an accepted safe limitation before profile acceptance
- **AND** the OCI paging/retention adaptation remains explicitly assigned rather
  than assumed complete
- **AND** RHIDP-18850 owns verification of the model-catalog bridge response and
  field semantics against its consumed model-catalog-types contract before
  provider adaptation is specified

#### Scenario: Keep the coding-story mapping deferred

- **WHEN** RHIDP-18843's delivery scope is reviewed
- **THEN** it contains no newly created coding stories or runtime package changes
- **AND** planning checks are in `acceptance-checklist.md`, separate from the
  implementation-only `tasks.md`, which has no numbered tasks at this stage
- **AND** it records the later requirement for exactly one coding story per
  in-scope change-local x.y implementation task at an accepted revision, and
  exactly one story for every such task
- **AND** missing tasks/artifacts or pending evidence/approvals are not described
  as completed implementation
- **AND** planning acceptance or merge does not mark implementation tasks complete
