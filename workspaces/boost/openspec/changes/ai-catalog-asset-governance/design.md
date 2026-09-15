# Design: AI Catalog Asset Governance

## Scope

This is follow-on design work for RHDHPLAN-1508. The current Boost release
baseline is the frontend plugin plus the OGX entity provider. The Boost backend
is not released. The design must therefore extend the current Catalog/OGX
boundary rather than introduce a parallel entity-authorization system.

## Current model

- The frontend reads entities through `catalogApiRef`.
- OGX emits ordinary Catalog entities.
- Entity visibility is controlled by Catalog's built-in
  `catalog.entity.read` permission.
- RHDH permission/RBAC configuration supplies roles and conditional policies.
- Providers supply entity data; they do not store authorization decisions.

The current OGX values relevant to policy examples are category `agent` for
agents, category `model-server` for model servers, source `ogx`, and the
provider's default namespace. Examples must use values the provider actually
emits.

## Target decisions

### Entity visibility

Use `catalog.entity.read` for discovery and detail access. Existing conditions
may match annotations and metadata, and may compose with `anyOf`, `allOf`, and
`not`. Do not add a project-specific entity permission (for example,
`ai-catalog.asset.access`) or custom rule unless a specific condition cannot be
represented by the existing model.

### Default access

RHDH's configured permission/RBAC policy decides who receives
`catalog.entity.read`. A provider refresh updates entity data only; it does not
create an authorization record or policy-change timestamp. A Boost-specific
default-policy setting is considered only after a concrete requirement is shown
to be impossible to express through the Catalog permission model.

### Field-level visibility

Entity visibility and field redaction are separate. If a future backend API
returns sensitive fields, that API enforces the additional authorization at its
response boundary. A frontend tab or component is not a security boundary.

### Version policy

An annotation does not create policy inheritance. If explicit version entities
or relationships are introduced, evaluate direct Catalog policies first. A
custom cascade is justified only when an explicit relationship exists and
direct policies cannot express the required behavior. Precedence, refresh,
removal, and orphan behavior must be defined before implementation.

### Audit coverage

Use RHDH's `AuditorService` for policy, role, condition, and evaluation events.
Add provider or ingestion events only where an operational audit requirement is
not already covered. Do not create a second audit channel.

### SkillBundle representation

If skills are separate Catalog entities, use `catalog.entity.read` and the
same conditions. If skills remain nested in an API response, the API must
filter the nested data before returning it.

### Administration

Use the existing RHDH/RBAC administration surface. Do not create a standalone
AI Catalog policy-management page.

## Jira treatment

| Area                  | Design decision                                                                     |
| --------------------- | ----------------------------------------------------------------------------------- |
| Graduated visibility  | Catalog permission for entities; API redaction only for confirmed protected fields. |
| Conditional policies  | Existing annotation/metadata conditions; no duplicate custom rules by default.      |
| Version cascade       | Decision-gated after direct-policy evaluation.                                      |
| Default deny          | Deployment-managed `catalog.entity.read`; no provider state by default.             |
| Audit logging         | Existing `AuditorService` plus justified provider events.                           |
| SkillBundle filtering | Representation-dependent.                                                           |
| RBAC admin UI         | Existing administration surface; no standalone page.                                |

## Boundaries

This design does not claim that the unreleased Boost backend has already been
reconciled with the Catalog model. Its current project-specific checks are
named `ai-catalog.*`; that is an implementation example, not a future naming
requirement. This design also does not implement
field redaction, version inheritance, SkillBundle filtering, or ingestion
analytics without the decision gates above.
