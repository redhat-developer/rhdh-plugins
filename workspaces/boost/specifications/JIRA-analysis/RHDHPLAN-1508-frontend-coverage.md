# RHDHPLAN-1508 Frontend Coverage Analysis

> **Date:** 2026-09-08
> **Feature:** AI Catalog RBAC & Versioning Policy Model
> **Cross-referenced against:** RHDHPLAN-1509 (AI Catalog Discovery UI)

> **Reconciliation:** The original Jira analysis described custom AI Catalog
> permissions and a standalone policy-management page. Those descriptions are
> retained here only as traceability history. The current follow-on design uses
> Catalog's built-in `catalog.entity.read` permission, RHDH conditional
> policies, API-level redaction where a backend exposes protected fields, and
> the existing RHDH/RBAC administration surface. This work is outside the
> RHDH 2.1 frontend and OGX release baseline.

## Current frontend boundary

RHDHPLAN-1509 owns the developer-facing catalog experience: browse, search,
entity pages, and the frontend extensions delivered by the AI Catalog plugin.
The frontend reads ordinary catalog entities through `catalogApiRef`.

RHDHPLAN-1508 does not add a second entity-visibility permission or a new
frontend policy-management surface. Entity discovery is controlled by
`catalog.entity.read` and RHDH's configured permission/RBAC rules. Any future
field-level protection is enforced by the API that returns the protected data;
the frontend only renders the authorized response.

## Jira traceability and current treatment

| Story             | Original area                             | Current treatment                                                                                              | Frontend deliverable                                  |
| ----------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| RHIDP-15271       | Custom asset visibility permission        | Replaced by Catalog `catalog.entity.read`                                                                      | No separate UI                                        |
| RHIDP-15272       | Usage-docs permission and field filtering | Retained only as a possible future API-level redaction requirement                                             | No current UI contract                                |
| RHIDP-15273       | Graduated visibility UI                   | Frontend may render a protected-data/contact-owner state when an API omits or denies sensitive fields          | Follow-on integration with entity page                |
| RHIDP-15306       | Custom admin permission/default posture   | Use the RHDH policy for `catalog.entity.read` and the existing admin surface                                   | No Boost page                                         |
| RHIDP-15307       | Standalone policy dashboard               | Canceled as a standalone Boost page                                                                            | None                                                  |
| RHIDP-15308       | Standalone policy editor                  | Canceled as a standalone Boost page; use existing RHDH/RBAC administration                                     | None                                                  |
| RHIDP-15309       | Standalone default-posture UI             | Canceled as a standalone Boost page; deployment configuration remains the policy input                         | None                                                  |
| RHIDP-15310       | SkillBundle visibility                    | Apply Catalog authorization for separate entities or API response filtering for nested skills                  | Follow-on API/UI integration if the model requires it |
| RHIDP-15312       | Category/connector conditions             | Use existing RHDH conditions against provider-emitted metadata and annotations                                 | No custom frontend rule                               |
| RHIDP-15275       | Version-policy cascade                    | Consider only if a future entity model has explicit version relationships and direct policies are insufficient | No current UI                                         |
| RHIDP-15279/15280 | Audit coverage                            | Use existing RBAC audit facilities and provider operational events where needed                                | No current UI                                         |

The RHIDP-15304 standalone RBAC Admin UI epic is not an implementation target
for this design. Its Jira identifiers remain above so the change in approach
is visible during review.

## Relationship to RHDHPLAN-1509

RHDHPLAN-1509 renders the catalog experience. RHDHPLAN-1508 supplies the
follow-on authorization model consumed by that experience:

- Catalog entity visibility is enforced by the Catalog permission integration,
  not by a Boost-specific frontend permission check.
- A future API that returns sensitive usage or connection fields must enforce
  field-level authorization server-side.
- A frontend contact-owner or redacted state is presentation of that API
  result, not the security boundary.

There is no current RHDH 2.1 frontend deliverable for RHDHPLAN-1508 beyond
remaining alignment with the Catalog response model.

## OpenSpec coverage

The current design is captured in
`openspec/changes/ai-catalog-asset-governance/`:

| Area                   | OpenSpec coverage                              |
| ---------------------- | ---------------------------------------------- |
| Entity visibility      | `specs/graduated-visibility/`                  |
| Conditional policies   | `specs/conditional-policies/`                  |
| Version behavior       | `specs/version-policy-cascade/`                |
| Default entity access  | `specs/default-deny-config/`                   |
| Audit coverage         | `specs/audit-logging/`                         |
| SkillBundle behavior   | `specs/skillbundle-filtering/`                 |
| Administration surface | Existing RHDH/RBAC surface; no standalone spec |

This table is a traceability map, not a claim that all listed behavior is
implemented in the current release.
