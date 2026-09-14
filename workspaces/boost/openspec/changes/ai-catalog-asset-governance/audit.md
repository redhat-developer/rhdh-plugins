## Audit status: superseded

**Last audited:** 2026-09-04

The previous audit was generated against an earlier AI Catalog RBAC design. Its
findings are preserved in Git history but are not current requirements.

The proposal, design, behavioral specs, and tasks have since been reconciled
around Backstage Catalog's built-in `catalog.entity.read` permission, RHDH
conditional policies, API-level field redaction where required, and the
existing RBAC audit and administration surfaces.

Run the OpenSpec audit again after the cleanup is reviewed. The resulting audit
should be treated as the source for any remaining coherence or cross-reference
issues.
