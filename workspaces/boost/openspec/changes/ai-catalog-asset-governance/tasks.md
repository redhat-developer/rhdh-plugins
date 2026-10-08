# Tasks: AI Catalog Asset Governance

These are follow-on tasks. They do not add RBAC behavior to the RHDH 2.1
frontend and OGX release baseline.

## 1. Validate the Catalog baseline (P0)

Related Jira: RHIDP-15270, RHIDP-15271, RHIDP-15312

- [ ] Confirm AI entity list and detail access use `catalog.entity.read`.
- [ ] Verify denied entities are filtered by the Catalog authorization path.
- [ ] Verify OGX emits the category, source, version, and namespace data used
      by policy examples.
- [ ] Record the current unreleased backend's project-specific checks (for
      example, `ai-catalog.*`) as follow-on reconciliation work rather than
      release behavior.

## 2. Document deployment policies (P0)

Related Jira: RHIDP-15270, RHIDP-15276, RHIDP-15306, RHIDP-15312

- [ ] Add concise allow, deny, category, source, namespace, and composed
      condition examples using actual provider values.
- [ ] Confirm that providers do not persist authorization decisions or
      policy-change timestamps.
- [ ] Do not add `ai-catalog.rbac.*` configuration without a documented gap.

## 3. Gate future API redaction (P1)

Related Jira: RHIDP-15270, RHIDP-15272, RHIDP-15273

- [ ] Inventory future APIs that return protected fields.
- [ ] If none exist, close this workstream as not applicable.
- [ ] If one exists, define and test response-level redaction and frontend
      handling for the confirmed fields only.

## 4. Gate version inheritance (P1)

Related Jira: RHIDP-15274, RHIDP-15275

- [ ] Confirm whether explicit asset-to-version relationships exist.
- [ ] Test direct Catalog policies before designing inheritance.
- [ ] If inheritance is required, define precedence, refresh, removal, and
      orphan behavior before adding a custom cascade.

## 5. Reconcile audit and SkillBundle behavior (P1)

Related Jira: RHIDP-15277, RHIDP-15279, RHIDP-15280, RHIDP-15310

- [ ] Confirm policy and evaluation events use `AuditorService`.
- [ ] Identify only provider events not covered by that service.
- [ ] Determine whether skills are separate entities or nested API data.
- [ ] Implement only the resulting audit or filtering gaps.

## 6. Documentation and verification (P2)

- [ ] Keep the active docs aligned with the Catalog/OGX baseline.
- [ ] Keep historical Jira analysis clearly marked as traceability, not an
      implementation source of truth.
- [ ] Verify OpenSpec scenario steps remain concrete and testable.
