# Proposal: AI Catalog Asset Governance

## Release boundary

RHDH 2.1 includes the AI Catalog frontend plugin and the OGX entity provider.
It does not include the Boost backend or a Boost-specific RBAC backend module.
This change records follow-on governance work built on that release baseline.

## Baseline

The frontend reads ordinary Backstage catalog entities through `catalogApiRef`.
OGX emits ordinary catalog entities with AI asset annotations. The frontend
does not own entity authorization.

The unreleased Boost backend still contains project-specific Catalog permission
checks, currently named `ai-catalog.*`. That name is an implementation example,
not a commitment to the future permission namespace or release contract.

## Proposed direction

1. Use Backstage Catalog's built-in `catalog.entity.read` permission for AI
   entity discovery.
2. Use the RHDH permission/RBAC configuration and its existing conditional
   policies to scope access by provider-emitted annotations and metadata.
3. Add field-level authorization only when a future API actually returns
   protected usage, connection, configuration, or deployment data.
4. Evaluate direct Catalog policies on explicit version entities before
   considering inherited policy or a custom cascade.
5. Reuse RHDH's existing RBAC audit and administration surfaces.
6. Decide authorization for SkillBundle contents from their representation:
   Catalog permission for separate entities, response filtering for nested
   API data.

## Not proposed by this change

- A duplicate project-specific entity permission by default (for example,
  `ai-catalog.asset.access`); a concrete Catalog limitation would require a
  separate permission-design decision.
- Custom category, source, or tenant rules when existing conditions are enough.
- A Boost-specific `ai-catalog.rbac.defaultPolicy` setting or provider-stored
  authorization records without a demonstrated gap.
- A standalone AI Catalog RBAC page.
- Any backend, field-redaction, version-cascade, or ingestion-analytics work
  that has not passed its corresponding decision gate.

## Jira traceability

| Area        | Treatment                                                                        |
| ----------- | -------------------------------------------------------------------------------- |
| RHIDP-15270 | Catalog entity visibility and future API redaction.                              |
| RHIDP-15274 | Direct version policy first; inheritance only after an explicit gap is proven.   |
| RHIDP-15277 | Reuse RBAC audit coverage; add provider events only when required.               |
| RHIDP-15304 | Standalone RBAC UI remains canceled.                                             |
| RHIDP-15276 | Default access is expressed through `catalog.entity.read` policy and conditions. |
| RHIDP-15281 | Use Catalog query filtering and conditions before custom handling.               |
| RHIDP-15305 | Decide based on separate versus nested skill representation.                     |

## Work products

- Validate the Catalog/OGX baseline and document policy examples using actual
  emitted values.
- Decide whether a future API needs field-level redaction.
- Decide whether explicit version relationships need inherited policy.
- Identify audit gaps not covered by `AuditorService`.
- Resolve SkillBundle representation before implementing filtering.
