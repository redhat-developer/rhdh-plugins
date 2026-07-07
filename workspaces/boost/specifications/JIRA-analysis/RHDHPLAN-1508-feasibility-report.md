# RHDHPLAN-1508 Feasibility Report: RBAC Acceptance Criteria vs. Backstage Permission Framework

**Date:** 2026-07-07
**Purpose:** Assess whether each RHIDP epic under RHDHPLAN-1508 can be implemented within the existing Backstage permission/RBAC framework without requiring upstream changes.

---

## Framework Capabilities Summary

Before analyzing each epic, here is what the Backstage permission framework **does and does not** provide:

| Capability                                                                                   | Status                                                                             |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `PermissionPolicy.handle()` — flat per-request evaluation                                    | **Available**                                                                      |
| `createPermission()` / `permissionsRegistry.addPermissions()`                                | **Available**                                                                      |
| `ALLOW` / `DENY` definitive decisions                                                        | **Available**                                                                      |
| `CONDITIONAL` decisions (delegated to plugin backend)                                        | **Available** — requires `resourceType`                                            |
| `isResourcePermission()` type narrowing                                                      | **Available**                                                                      |
| Custom rules via `apply(entity, params)` → boolean                                           | **Available** — synchronous, single entity, no external calls                      |
| Rule composition via `anyOf` / `allOf` / `not`                                               | **Available** — same entity only                                                   |
| `toQuery()` for database-level filtering                                                     | **Available**                                                                      |
| `RequirePermission` frontend guard                                                           | **Available**                                                                      |
| Per-plugin or per-resource-type config keys (e.g., `permission.rbac.<plugin>.defaultPolicy`) | **Not available**                                                                  |
| Hierarchical/cascading policy evaluation (parent→child)                                      | **Not available**                                                                  |
| Recursive entity traversal in `apply()`                                                      | **Not available** — `apply()` is synchronous, receives one entity                  |
| Policy-driven config toggles (`allow`/`deny` enum values)                                    | **Not available** — `permission.rbac.defaultPolicy` is a `$include` to a YAML file |
| RBAC admin UI extension points                                                               | **Not available** — the RBAC admin UI is a closed upstream plugin                  |

---

## Epic-by-Epic Analysis

### RHIDP-15270: AI Catalog Graduated Visibility Permissions

**Summary:** Define and register `ai-catalog.asset.read`, `ai-catalog.asset.read.usage-docs`, and `ai-catalog.admin` permissions; implement a two-tier visibility model.

#### Acceptance Criteria Assessment

| Criterion                                                                                                        | Feasible without upstream changes? | Assessment                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-catalog.asset.read` defined via `createPermission` and registered via `permissionsRegistry.addPermissions()` | **YES**                            | Standard permission registration — boost already does this for its 16 lifecycle permissions                                                    |
| `ai-catalog.asset.read.usage-docs` defined and registered for field-level filtering                              | **YES**                            | Same registration pattern. Field-level filtering is a backend implementation detail — the permission gates access, the backend omits fields    |
| `ai-catalog.admin` defined and registered, gating management actions                                             | **YES**                            | Same registration pattern. What it gates is custom application logic, not framework behavior                                                   |
| Two-tier graduated visibility (Tier 1 = basic discovery, Tier 2 = usage docs)                                    | **YES**                            | Two separate permissions with two `isResourcePermission` checks in the policy. Backend returns different field sets per tier. Standard pattern |
| Frontend uses `RequirePermission` to gate usage doc sections                                                     | **YES**                            | `RequirePermission` is a standard Backstage component for exactly this purpose                                                                 |
| Users without Tier 2 see "request access" affordance                                                             | **YES**                            | Frontend conditional rendering based on permission check result — no framework changes needed                                                  |
| All three exported from common package                                                                           | **YES**                            | Package export — no framework involvement                                                                                                      |
| RBAC administrators can configure policies independently                                                         | **YES**                            | Standard RBAC policy configuration — each permission gets its own policy rules                                                                 |
| Permission definitions documented with examples                                                                  | **YES**                            | Documentation exercise                                                                                                                         |

**Verdict: FULLY FEASIBLE** — All acceptance criteria use standard permission registration and policy patterns. No upstream changes required. This is the most straightforward epic.

---

### RHIDP-15274: Version-Level Policy Cascade for AI Catalog Assets

**Summary:** Asset-level RBAC policies cascade to all version entities unless a version-specific override exists.

#### Acceptance Criteria Assessment

| Criterion                                                                        | Feasible without upstream changes? | Assessment                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Policy cascade evaluates version-level policies first; falls back to asset-level | **REQUIRES CUSTOM IMPLEMENTATION** | The framework evaluates each permission request against a single entity. There is no built-in "check for version-specific policy, then fall back to parent asset policy." This requires custom `PermissionPolicy` logic that performs catalog lookups during evaluation |
| Asset-level policies auto-apply to all versions when no version override set     | **REQUIRES CUSTOM IMPLEMENTATION** | Same — the policy must resolve the parent asset entity and check its policies. `apply()` is synchronous and cannot make catalog API calls                                                                                                                               |
| Version-specific override takes precedence for that version only                 | **REQUIRES CUSTOM IMPLEMENTATION** | The precedence logic itself is straightforward code, but it requires the policy to know about the entity hierarchy                                                                                                                                                      |
| New versions inherit asset-level policies immediately upon creation              | **REQUIRES CUSTOM IMPLEMENTATION** | Same cascade logic — no manual policy assignment needed means the cascade must execute at query time                                                                                                                                                                    |
| Removing version override causes revert to asset-level policy                    | **REQUIRES CUSTOM IMPLEMENTATION** | Follows from the cascade logic                                                                                                                                                                                                                                          |
| Documented for RBAC administrators                                               | **YES**                            | Documentation exercise                                                                                                                                                                                                                                                  |
| Unit and integration tests                                                       | **YES**                            | Testing exercise                                                                                                                                                                                                                                                        |

**Verdict: FEASIBLE WITH SIGNIFICANT CUSTOM WORK — NO UPSTREAM CHANGES NEEDED, BUT NOT A FRAMEWORK FEATURE**

The cascade can be implemented without modifying the Backstage framework itself, but it requires building custom infrastructure:

**Option A — Custom PermissionPolicy with catalog lookups:**
The `handle()` method is async (`Promise<PolicyDecision>`), so it _can_ make catalog API calls during evaluation. The policy would:

1. Receive a permission request for a version entity
2. Check if a version-specific policy exists (via stored policy rules)
3. If not, look up the parent asset entity via the catalog API (using `rhdh.io/ai-asset-version` annotation or `versionOf` relation)
4. Evaluate the asset-level policy rules against the parent entity

This is doable but has performance implications — every version-entity permission check requires a catalog lookup.

**Option B — Denormalized policies at ingestion time:**
When a version entity is ingested, copy the parent asset's policy rules to the version entity's metadata. Policy evaluation then checks the version entity's own metadata without needing to traverse the hierarchy. Override by writing version-specific rules that shadow the inherited ones.

This avoids runtime catalog lookups but requires the entity provider to maintain policy synchronization.

**Recommendation:** Option B is more performant and avoids the `apply()` synchronous limitation. The entity provider already has access to the catalog and can denormalize policies during ingestion. This is entirely within the boost workspace — no upstream changes needed.

---

### RHIDP-15276: Default-Deny Policy Configuration for AI Catalog Assets

**Summary:** Configurable default-deny/allow setting for newly ingested assets, with per-category and per-connector scoping, gated by `ai-catalog.admin`.

#### Acceptance Criteria Assessment

| Criterion                                                              | Feasible without upstream changes?                | Assessment                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `permission.rbac.aiCatalog.defaultPolicy` accepts `allow`/`deny`       | **NOT AS SPECIFIED** — but achievable differently | This specific config key pattern doesn't exist in the RBAC plugin. However, the same outcome is achievable through a catch-all RBAC policy rule (see below)                                                                                                                                    |
| Only accessible to `ai-catalog.admin` holders                          | **YES**                                           | The `ai-catalog.admin` permission gates who can modify the policy — standard permission check                                                                                                                                                                                                  |
| Per-category defaults (`rhdh.io/ai-asset-category`)                    | **YES with custom rules**                         | A custom permission rule can inspect entity annotations to match categories. Combined with a conditional decision, this filters per-category                                                                                                                                                   |
| Per-connector defaults (different source connectors)                   | **YES with custom rules**                         | Same approach — a custom rule inspects a source-connector annotation on the entity                                                                                                                                                                                                             |
| Default-deny: newly ingested entities not visible until explicit ALLOW | **YES**                                           | A catch-all DENY conditional rule for `ai-catalog.asset.read` achieves this. Entities are invisible until an explicit ALLOW policy overrides the catch-all                                                                                                                                     |
| Default-allow: entities visible to all users with the permission       | **YES**                                           | Absence of the catch-all deny rule = default-allow. Standard RBAC behavior                                                                                                                                                                                                                     |
| Changing default only affects subsequently ingested assets             | **REQUIRES CUSTOM IMPLEMENTATION**                | The RBAC framework doesn't distinguish "ingested before/after a policy change." This requires either: (a) marking entities with an ingestion-time annotation that the policy checks, or (b) accepting that the policy change affects all entities (which is simpler and arguably more correct) |
| Log entry when asset ingested under default-deny                       | **YES**                                           | Application-level logging in the entity provider — no framework involvement                                                                                                                                                                                                                    |
| Audit log for changing the setting                                     | **YES**                                           | Application-level audit logging — covered by RHIDP-15277                                                                                                                                                                                                                                       |
| Tests for both postures, per-category, per-connector                   | **YES**                                           | Testing exercise                                                                                                                                                                                                                                                                               |

**Verdict: FEASIBLE WITHOUT UPSTREAM CHANGES — using catch-all policy approach (Option 2 from questions doc)**

The implementation path:

1. Define custom permission rules: `isAiAssetCategory({ category })` and `isFromConnector({ connector })` that inspect entity annotations
2. Default-deny = a catch-all conditional DENY rule for `ai-catalog.asset.read` that matches all AI catalog entities
3. Per-category defaults = conditional rules scoped to specific `rhdh.io/ai-asset-category` values
4. Per-connector defaults = conditional rules scoped to a source-connector annotation
5. The `ai-catalog.admin` permission gates who can create/modify these policy rules

**Key deviation from spec:** The config key `permission.rbac.aiCatalog.defaultPolicy: allow|deny` is replaced by the presence/absence of catch-all deny policy rules. The operational outcome is identical — the mechanism is RBAC policies rather than a config toggle. The one criterion that requires custom work is "only affects subsequently ingested assets" — this is unusual for an RBAC system (policies typically apply to all matching entities) and should be discussed with PM.

---

### RHIDP-15277: AI Catalog RBAC Audit Logging

**Summary:** Audit logging for RBAC policy changes, `ai-catalog.admin` management actions, and entity provider ingestion sync events.

#### Acceptance Criteria Assessment

| Criterion                                                                                 | Feasible without upstream changes? | Assessment                                                                                                                            |
| ----------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| RBAC policy change events (timestamp, actor, action, target, previous/new value)          | **YES**                            | Application-level structured logging when policy CRUD operations occur. Boost already emits structured logs for lifecycle transitions |
| `ai-catalog.admin` management events (posture changes, category/connector policy changes) | **YES**                            | Application-level logging around the management API endpoints. These are boost-owned endpoints, not upstream                          |
| Ingestion sync events (provider, counts, duration, errors)                                | **YES**                            | Application-level logging in the entity provider. Entity providers are boost-owned                                                    |
| Individual asset ingestion events (entity ref, operation, source)                         | **YES**                            | Same — entity provider logging                                                                                                        |
| Structured JSON format compatible with RHDH log aggregation                               | **YES**                            | Log format is an application concern. RHDH already uses structured JSON logging                                                       |
| Dedicated audit log channel (not mixed with debug logs)                                   | **YES**                            | Backstage supports multiple logger instances. A dedicated `audit` logger can be created                                               |
| Sufficient context without exposing sensitive content                                     | **YES**                            | Log content design — application-level concern                                                                                        |
| Unit tests for event emission                                                             | **YES**                            | Testing exercise                                                                                                                      |

**Verdict: FULLY FEASIBLE** — Audit logging is entirely an application-level concern. All events are emitted by boost-owned code (policy management endpoints, entity providers, management APIs). No upstream changes needed.

---

### RHIDP-15281: AI Catalog RBAC Performance and Multi-Tenancy

**Summary:** Performance testing at scale and multi-tenant filtering using policy-based tenant scoping.

#### Acceptance Criteria Assessment

| Criterion                                                                 | Feasible without upstream changes? | Assessment                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance test suite at 100/500/1000 asset scale                        | **YES**                            | Testing infrastructure — no framework changes                                                                                                                                                     |
| Performance baselines for unfiltered, single-permission, two-tier queries | **YES**                            | Measurement exercise                                                                                                                                                                              |
| Permission-check latency overhead documented                              | **YES**                            | Documentation exercise                                                                                                                                                                            |
| Multi-tenant filtering via policy-based tenant scoping                    | **YES with custom rules**          | A custom permission rule `isInTenant({ tenant })` can inspect entity namespace or a tenant annotation. The conditional decision filters entities per tenant at the database level via `toQuery()` |
| Single entity provider serves multiple tenants                            | **YES**                            | Entity provider design — application-level                                                                                                                                                        |
| No per-tenant re-ingestion needed                                         | **YES**                            | Follows from policy-based filtering — the same entities exist once, visibility is controlled by policy                                                                                            |
| Performance tests reproducible and CI-integratable                        | **YES**                            | CI/testing infrastructure                                                                                                                                                                         |

**Verdict: FULLY FEASIBLE** — Performance testing is infrastructure work. Multi-tenant filtering maps cleanly to custom permission rules with conditional decisions. The `toQuery()` mechanism enables database-level tenant filtering, which is exactly how Backstage envisions conditional decisions being used at scale. No upstream changes needed.

---

### RHIDP-15304: RBAC Admin UI Section for AI Catalog Policy Management

**Summary:** Dedicated AI Catalog section in the RHDH RBAC admin UI for SMP Admins to manage visibility policies without writing YAML.

#### Acceptance Criteria Assessment

| Criterion                                                                                | Feasible without upstream changes? | Assessment                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RBAC admin UI includes "AI Catalog" section visible only to `ai-catalog.admin` holders   | **DEPENDS ON APPROACH**            | Cannot add a section to the upstream Backstage RBAC plugin UI without upstream changes. However, a **standalone AI Catalog admin page** within the boost frontend achieves the same outcome |
| UI allows setting visibility policies scoped to individual skill, category, or connector | **YES — as standalone page**       | A boost-owned admin page can present RBAC policy CRUD operations with AI Catalog-specific form fields                                                                                       |
| UI displays current default posture per category/connector with controls to change       | **YES — as standalone page**       | The page reads current RBAC policies and presents them grouped by category/connector                                                                                                        |
| UI supports creating/editing/deleting conditional policies without YAML                  | **YES — as standalone page**       | The page translates form inputs into RBAC policy API calls — no YAML editing                                                                                                                |
| UI shows summary of all active AI Catalog policies                                       | **YES — as standalone page**       | Read from RBAC policy storage, filter to AI catalog permissions, group and display                                                                                                          |
| Changes produce audit log entries                                                        | **YES**                            | The management API emits audit events — covered by RHIDP-15277                                                                                                                              |
| Follows RHDH admin UI patterns (MUI, Backstage theme)                                    | **YES**                            | Standard frontend development using Backstage component library                                                                                                                             |

**Verdict: FEASIBLE AS A STANDALONE ADMIN PAGE — NOT as a section added to the upstream RBAC admin UI**

The key deviation: RHDHPLAN-1508 says "dedicated section in the RHDH RBAC admin UI" but the RBAC admin UI is an upstream plugin. Two paths:

1. **Standalone AI Catalog admin page** (recommended): A new route in the boost frontend (`/ai-catalog/admin/rbac`) that provides purpose-built AI Catalog policy management. It can link from the main RBAC admin UI via a sidebar item or banner, but it's a separate page owned by the boost plugin. No upstream changes needed.

2. **RHDH downstream RBAC plugin extension**: If RHDH's downstream fork of the RBAC plugin already has extension points or customizations, a section could be added there — but this is an RHDH platform team concern, not a boost workspace concern, and still involves modifying the RBAC plugin.

**Recommendation:** Option 1. The SMP Admin persona doesn't care whether the policy management UI is a tab inside the RBAC page or a linked page — they care that it exists and is easy to use. A standalone page avoids upstream dependencies entirely.

---

### RHIDP-15305: SkillBundle RBAC Filtering at Read Time

**Summary:** SkillBundle detail views filter out skills the current user cannot see via `ai-catalog.asset.read`.

#### Acceptance Criteria Assessment

| Criterion                                                                  | Feasible without upstream changes? | Assessment                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bundle response filters out skills user lacks `ai-catalog.asset.read` on   | **YES**                            | Backend API logic: when building the bundle response, check `ai-catalog.asset.read` for each included skill entity and omit those that return DENY                                                                                  |
| Filtering at read time by backend, not storage time                        | **YES**                            | Application-level API design — the Neo4j query returns all skills in the bundle, the backend filters before responding                                                                                                              |
| Automated test: mixed permitted/restricted skills returns only permitted   | **YES**                            | Testing exercise                                                                                                                                                                                                                    |
| Bundle metadata reflects filtered view (count = visible skills, not total) | **YES**                            | Backend response construction — recalculate count after filtering                                                                                                                                                                   |
| Documentation: bundle contents may differ per viewer                       | **YES**                            | Documentation exercise                                                                                                                                                                                                              |
| Read-time filtering adds no more than 10% latency                          | **DEPENDS ON IMPLEMENTATION**      | Batch permission checks for all skills in a bundle are feasible via `authorizeConditional()` which can evaluate multiple entities against the same permission in one call. Performance depends on bundle size and policy complexity |

**Verdict: FULLY FEASIBLE** — Read-time filtering is standard backend logic. The Backstage permission framework supports batch authorization via `authorizeConditional()`, which can evaluate multiple entities in a single call. The bundle API reads from Neo4j, then filters through the permission framework before responding. No upstream changes needed.

---

## Summary Matrix

| Epic                             | Key         | Feasible without upstream changes? | Implementation complexity | Notes                                                                                                                     |
| -------------------------------- | ----------- | ---------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Graduated Visibility Permissions | RHIDP-15270 | **YES**                            | Low                       | Standard permission registration and policy patterns                                                                      |
| Version-Level Policy Cascade     | RHIDP-15274 | **YES — with custom work**         | High                      | Requires custom cascade logic; recommend denormalized policies at ingestion time (Option B)                               |
| Default-Deny Configuration       | RHIDP-15276 | **YES — via catch-all policy**     | Medium                    | Config key pattern replaced by catch-all RBAC policy rules; one criterion ("only affects new assets") needs PM discussion |
| RBAC Audit Logging               | RHIDP-15277 | **YES**                            | Medium                    | Entirely application-level logging in boost-owned code                                                                    |
| Performance & Multi-Tenancy      | RHIDP-15281 | **YES**                            | Medium                    | Custom tenant-scoping rules; performance testing is infrastructure                                                        |
| RBAC Admin UI Section            | RHIDP-15304 | **YES — as standalone page**       | Medium-High               | Cannot modify upstream RBAC plugin UI; standalone admin page achieves same outcome                                        |
| SkillBundle Read-Time Filtering  | RHIDP-15305 | **YES**                            | Medium                    | Standard backend filtering using batch permission checks                                                                  |

## Key Findings

1. **All 7 epics have implementation paths that do NOT require upstream Backstage changes.** However, 3 epics require implementation approaches that deviate from the exact wording of RHDHPLAN-1508.

2. **Three areas require PM discussion:**
   - **RHIDP-15274 (Policy Cascade):** The framework has no cascade — must be built as custom logic. Recommend denormalized policies (set at ingestion time) rather than runtime cascade for performance.
   - **RHIDP-15276 (Default-Deny Config):** The `permission.rbac.aiCatalog.defaultPolicy` config key pattern doesn't exist. Recommend catch-all RBAC policy rules instead. Also, "only affects subsequently ingested assets" is atypical for RBAC — policies normally apply to all matching entities.
   - **RHIDP-15304 (Admin UI):** Cannot add sections to the upstream RBAC admin UI. Recommend a standalone AI Catalog admin page linked from the main navigation.

3. **The catch-all policy pattern (Option 2) is the recurring solution** for multiple criteria across RHIDP-15270, RHIDP-15276, and RHIDP-15305. It's the framework-aligned way to achieve default-deny, category-scoped, and connector-scoped policy behaviors.

4. **Custom permission rules are the main building block.** Rules like `isAiAssetCategory()`, `isFromConnector()`, `isInTenant()` inspect entity annotations and produce conditional decisions that filter at the database level via `toQuery()`. This is exactly how the framework is designed to be extended.

5. **Performance risk concentrates in RHIDP-15274.** Runtime cascade (looking up parent asset during every version-entity permission check) conflicts with the <10% latency overhead requirement. Denormalization at ingestion time avoids this but adds entity provider complexity.
