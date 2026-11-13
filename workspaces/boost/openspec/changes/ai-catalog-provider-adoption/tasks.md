# Provider adoption implementation tasks

**Status: Implementation task breakdown deferred.** RHIDP-18843 supplies the
provider inventory, cohort, and pilot inputs. No numbered implementation tasks
are defined at this stage; this file is not an executable implementation plan.

This file is reserved for RHDHPLAN-1507 implementation work covered by this
change: code that delivers the specified functionality, associated automated
tests, and documentation for the new or changed code. Planning reviews,
evidence gathering, grill-me decisions, specification audits, and planning
acceptance are tracked in the separate
[RHIDP-18843 acceptance checklist](acceptance-checklist.md).

Stories under RHIDP-18839 and RHIDP-18840 establish the shared metadata/SDK and
incremental-ingestion contracts. Those stories define implementation tasks in
their relevant OpenSpec changes. Under RHIDP-18841, RHIDP-18849 and RHIDP-18850
use the accepted shared contracts to refine provider adoption specifications
and the implementation tasks in this change. Final scope and task boundaries
remain deferred until those contracts and profiles are accepted.

At that point, every implementation task must have a change-local `x.y` ID.
Each task maps to exactly one coding Jira story, and every in-scope task has one
such story, tied to the OpenSpec change path and accepted revision. Coding
stories are created only after specification acceptance. Planning-checklist IDs
are not part of this mapping.

Implementation tasks remain unchecked when planning specifications merge; mark
them complete only when the specified implementation work and its required
verification are complete. Merging RHIDP-18843 does not establish runtime
implementation, migration, qualification, or readiness to apply this change.

## Canonical Touchpoints

Change type: **docs-only** planning. No canonical document updates in this stage.

- Product PRDs under `specifications/prd/`: **None** modified. RHDHPLAN-1507 and
  RHIDP-18843 define this stage's scope.
- ADRs under `specifications/adr/`: **None** modified. Shared SDK and ingestion
  architecture decisions remain with their owning stories.
- Long-lived specifications under `openspec/specs/`: **None** modified. The
  [implemented OGX specification](../../specs/ogx-entity-provider/spec.md) remains
  the release behavior reference.

Later implementation specifications must reconcile these touchpoints with the
accepted runtime scope before adding executable tasks.
