# RHDHPLAN-1508 Refinement Notes

## Evidence reviewed

- RHDHPLAN-1508 live description and comments through 2026-09-14, read with `acli`.
- RHDHPLAN-1507 live entity-model contract and RHDHPLAN-1169 permission-model overlap.
- `redhat-developer/rhdh-plugins` PR #3753, which introduced the original Boost OpenSpec, and merged PR #4613, which re-baselined it on built-in Catalog permissions.
- Current `workspaces/boost` governance artifacts and `workspaces/ai-integrations` upstream-aligned `AiResource` artifacts.
- Published Boost common versions 0.4.0 through 0.4.2, which already expose `ai-catalog.admin`.
- PM scope decision supplied by John Collier in the PR cross-reference discussion on 2026-09-15: existing permission-management UI, whole-entity read with no graduated visibility, and inheritance deferred until RHDHPLAN-1507 defines its prerequisite model.

## Accepted refinement

The September 8 discussion established reuse of existing Catalog permissions. The explicit PM decision supplied on September 15 resolves the product scope: whole-entity visibility and existing RBAC administration are sufficient, and inheritance is deferred pending RHDHPLAN-1507. The table distinguishes the written Jira criteria from the accepted refinement; Jira reconciliation remains tracked in task 1.4. PR #4613's 2.1 release exclusions alone are not evidence that a 2.2 product requirement was removed.

| Area              | Jira acceptance criteria                                 | Current platform/workspace evidence                                                                                                                                                    | Refined treatment                                                                                                                                                                        |
| ----------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Entity discovery  | Add `ai-catalog.asset.read`                              | `catalog.entity.read` already gates entity list/detail and supports resource conditions                                                                                                | Reuse `catalog.entity.read`; do not double-gate entities                                                                                                                                 |
| Usage details     | Add `ai-catalog.asset.read.usage-docs` and redact fields | Entity readers can access ordinary Catalog entity data                                                                                                                                 | PM accepted whole-entity read; remove the protected-detail capability and introduce no separate usage-detail grant or redaction layer in v1                                              |
| Conditional scope | Add AI category/source rules                             | Catalog already exposes annotation, label, metadata, spec, kind, and owner rules with composition                                                                                      | Use existing rules against exact provider values; add custom rules only for a proven expression gap                                                                                      |
| Default posture   | Runtime `allow                                           | deny`, default deny, SMP Admin UI                                                                                                                                                      | Unmatched RBAC requests are already denied; broad defaults are deployment configuration and scoped access is ordinary conditional policy                                                 | Keep authorization RBAC-owned; use the existing RBAC UI and do not add an AI-specific runtime posture control |
| Version cascade   | Asset policy cascades; version override wins             | RHDHPLAN-1507 defines category/version/source but not stable cross-version identity, a multi-version representation, or a relationship contract                                        | PM deferred inheritance until 1507 defines the model; use direct per-entity policy now, with inheritance and precedence designed in a separate reviewed follow-up                        |
| Administration    | Dedicated AI Catalog section and `ai-catalog.admin`      | Existing permissions/conditions appear in the existing RBAC surface; `ai-catalog.admin` is already published from Boost common                                                         | Reuse existing RBAC administration; transition management operations to global `ai-catalog.manage` with one release of deprecated-name compatibility, without granting entity visibility |
| Audit             | Policy changes plus provider sync mutations              | RBAC already audits policy CRUD; provider mutations are a separate non-RBAC event source                                                                                               | Verify existing policy-change events without duplication or new permission-evaluation scope; retain provider events because 1508 explicitly requires them                                |
| SkillBundle       | Filter inaccessible skills at read time                  | 1507 already specifies `SkillBundle` nodes, `INCLUDES` relationships, and canonical skill identifiers; complete ownership, serving, and bundle-level authorization remain dependencies | Retain member checks with `catalog.entity.read`; conditional tasks 2.9–2.11 cover serving and testing after the contract is confirmed                                                    |
| Performance       | No more than 10 percent p95 latency regression           | The repository does not yet have a complete performance-test harness for this path                                                                                                     | Retain the threshold without prescribing new infrastructure; verify the comparison manually if necessary                                                                                 |

## Workspace boundary

```text
ai-integrations                         boost / serving feature
-------------------------------         --------------------------------
AiResource kind and validation          AI Catalog browse/detail experience
provider-emitted annotations      --->   conditional policy examples
source/category/version metadata         whole-entity read experience
                                         ai-catalog.manage (Boost common)
                                         SkillBundle API filtering, if nested
                         shared: RHDH Catalog + Permission/RBAC + Audit Log
```

Entity shape and provider normalization remain owned by RHDHPLAN-1507 and `ai-integrations`. RHDHPLAN-1508 consumes that contract. Boost is a likely home for experience-specific APIs and UI integration, but it must not create a parallel entity authorization path.

## Decision and dependency status

1. **D1/D2, accepted 2026-09-15:** `catalog.entity.read` authorizes all values stored on an entity. V1 excludes graduated visibility, a separate usage-detail permission, and redaction. Verify existing consumers do not retain a second detail gate.
2. **D4, accepted 2026-09-15:** Use the existing Backstage/RHDH RBAC UI, administration permissions, configuration, and conditions. No dedicated AI Catalog permission-management workflow is required.
3. **D6, deferral accepted 2026-09-15:** Inheritance awaits RHDHPLAN-1507's model and a reviewed follow-up that proves precedence and defines failure, migration, and rollback behavior. This does not block direct per-entity authorization.
4. **D8, serving dependency remains:** Build on 1507's existing graph representation and canonical members; resolve bundle-definition ownership, serving API, and bundle-level authorization before conditional serving tasks. Member filtering remains required when serving is implemented.
5. **D5, retained:** Define global `ai-catalog.manage` in Boost common with `attributes.action: update`; keep deprecated `ai-catalog.admin` compatibility for one release. Neither grants entity visibility or replaces RBAC policy-management permissions.
6. **D7, retained:** Verify existing policy-change audit events and retain provider-sync events. The audit-correlation warning remains open; this scope decision does not resolve it.
7. **Retained:** The 10 percent p95 requirement and existing authorization evaluation path remain unchanged.

## Jira acceptance-criteria impact

The accepted PM decision changes product scope as well as permission names: graduated visibility and dedicated administration workflows are excluded from v1, and inheritance is deferred pending 1507. Record those decisions in Jira or its linked implementation work rather than treating them as unanswered questions. Keep the existing condition-based entity filtering, management-permission contract, auditing, and performance requirements. Bundle serving remains subject to its specific architecture dependency; the baseline is independently deliverable.
