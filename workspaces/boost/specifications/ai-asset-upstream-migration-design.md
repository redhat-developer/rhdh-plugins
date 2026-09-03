# AI Asset Upstream Migration Design

> **Status: Ready for Review** | **Last updated: 2026-09-03**

**Story:** RHIDP-15302 | **Feature:** RHDHPLAN-1507 | **Epic:** RHIDP-15258
**Parent issue:** [#4042](https://github.com/redhat-developer/rhdh-plugins/issues/4042)

## Canonical source of truth

The RHIDP-15302 migration design document (mapping tables, field-level
transforms, consumer-facing impact, backward compatibility, and
sign-off) lives in OpenSpec:

**[openspec/changes/ai-catalog-entity-model/specs/migration-readiness/migration-plan.md](../openspec/changes/ai-catalog-entity-model/specs/migration-readiness/migration-plan.md)**

Do **not** duplicate mapping or transformation tables here. Update the
OpenSpec `migration-plan.md` file and keep this stub as a link only.

## Scope

The migration design document covers all seven AI-asset categories per
[Decision 1](../openspec/changes/ai-catalog-entity-model/design.md):
`agent`, `skill`, `rule`, `skill-bundle`, `mcp-server`, `ai-model`,
`model-server`. For each category it documents:

- Current kind / `spec.type` / annotation mapping (post entity-type
  pivot: #4164, #4211, #4260)
- RHDH 2.1 target with confidence level (High / Medium-High / Medium /
  Low)
- Field-level transformation rules
- Consumer-facing changes: catalog UI filters, entity references, API
  queries
- Backward compatibility strategy (annotation retention for one major
  version)
- Sign-off section for RHDH architect / tech lead review

`vector-store` and `ai-tool` are explicitly out of scope (Augment POC
vestiges).

## Related

- Behavioral requirements (Given/When/Then):
  [migration-readiness/spec.md](../openspec/changes/ai-catalog-entity-model/specs/migration-readiness/spec.md)
- Reconciled mapping tables:
  [#4189](https://github.com/redhat-developer/rhdh-plugins/pull/4189)
- Sibling track (annotation publish + CLI):
  [#4220](https://github.com/redhat-developer/rhdh-plugins/issues/4220)
  (RHIDP-15346 / RHIDP-15347) — out of scope for this design doc
