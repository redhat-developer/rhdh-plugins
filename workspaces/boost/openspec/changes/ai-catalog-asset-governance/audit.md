## Audit Report: ai-catalog-asset-governance

**Last audited:** 2026-09-04T14:16:13Z

### Summary

| Category                   | CRITICAL | WARNING | SUGGESTION |
| -------------------------- | -------- | ------- | ---------- |
| A Entity propagation       | 0        | 0       | 1          |
| B Enum / vocabulary        | 0        | 0       | 0          |
| C Semantic contradiction   | 1        | 0       | 0          |
| D Codebase & convention    | 0        | 0       | 0          |
| E Namespace & cross-change | 0        | 0       | 0          |
| F Template / copy-paste    | 0        | 0       | 0          |
| G Extended coherence       | 0        | 2       | 0          |
| H Security lint            | 0        | 0       | 0          |
| **Total**                  | **1**    | **2**   | **1**      |

_Two CRITICAL category-A event-name findings from the first pass (`tasks.md` §7.1/§7.2) were autofixed (expanded to the fully-qualified `ai-catalog.rbac.*` / `ai-catalog.ingestion.*` forms) and confirmed resolved on the re-audit pass._

### CRITICAL

- **[C] `design.md:88` — Decision 4 (posture-change timestamp via `AdminConfigService.setOverride()`) contradicts Decision 5 (posture is YAML-managed, no admin action).** Decision 4 states a policy-change timestamp is persisted in the DB "when an admin changes the default posture" via `AdminConfigService.setOverride()`; the rewritten Decision 5 (`design.md:90-92`) states default posture "is managed via YAML configuration ... not a dedicated admin page." If posture is YAML-only with no admin action/UI, there is no trigger for the `setOverride()` write. **Recommendation:** either (a) clarify that editing YAML + reload _is_ the "admin action" and describe how/when the timestamp is written on config reload, or (b) drop the `setOverride()` mechanism from Decision 4 and stamp the policy-change timestamp via a different trigger (e.g. config-change detection at startup). This also affects `tasks.md` §6.8 and the WARNING below. **Judgment call — not autofixed.**

### WARNING

- **[G] `tasks.md:100` — Verify item 10.11 has no implementation task.** `10.11 Verify \`ai-catalog.admin\` holders bypass default-deny for all assets`(also asserted in`specs/default-deny-config/spec.md:27`) has no corresponding task in groups 1–9. **Recommendation:** add an implementation task (e.g. under group 6 Default-Deny Configuration, or group 2 Graduated Visibility Backend): "Implement admin bypass — users with `ai-catalog.admin`skip deny-posture evaluation for`ai-catalog.asset.access`."
- **[G] `specs/default-deny-config/spec.md:34` — timestamp-comparison mechanism described in design/tasks is absent from the spec.** The "only new assets affected" behavior relies on comparing `rhdh.io/ai-catalog-ingested-at` against a persisted policy-change timestamp (`design.md:88`, `tasks.md` §6.8), but the spec only says the boundary "is tracked via" the annotation without specifying the comparison. **Recommendation:** add a scenario/requirement, e.g. "WHEN the conditional rule evaluates an entity AND its `rhdh.io/ai-catalog-ingested-at` is newer than the last policy-change timestamp THEN the catch-all DENY is applied." (Resolve jointly with the CRITICAL above, since the timestamp trigger is in question.)

### SUGGESTION

- **[A] `specs/graduated-visibility/spec.md:41` — Tier 1/Tier 2 field lists differ from `design.md:54-55`.** Design says "Tier 1: basic discovery (name, description, type, stage)"; the spec says "name, description, category, lifecycle stage, version count, tags" ("type"→"category", "stage"→"lifecycle stage") and lists "deployment parameters" in Tier 2, absent from design. **Recommendation:** reconcile the two — prefer the more detailed spec wording and propagate the field names ("category", "lifecycle stage", "version count", "tags", "deployment parameters") back into `design.md`. Left as a judgment call (which list is canonical) rather than autofixed.
