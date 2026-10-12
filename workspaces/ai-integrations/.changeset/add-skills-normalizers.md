---
'@red-hat-developer-hub/backstage-plugin-ai-skills-common': minor
---

Add pure OCI and npx metadata normalizers implementing design D3 native-field mappings and precedence, with input types, normalization diagnostics, shared catalog-valid tag processing, author string normalization, allowlisted extension mapping, and reusable native metadata fixtures including conflicting-version scenarios.

Both metadata normalizers and the existing `normalizeTags` helper share Backstage's catalog tag rules. Dots, underscores, consecutive hyphens, and tags longer than 63 characters are omitted with diagnostics. For example, `rhdh:2`, `version+beta`, and `tag#1` remain valid; `rhdh:2.2`, `has_underscore`, and `in--valid` are omitted. Development-only parity tests compare all three normalization paths with Backstage's catalog validator.

The OCI trusted-input fixture uses the tagged key `quay.io/octo/hello-world-skill:1.0.0-draft`, consistent with the per-tag identity contract. Its digest-addressed source URI is unchanged.
