---
'@red-hat-developer-hub/backstage-plugin-ai-skills-common': minor
---

Add pure OCI and npx metadata normalizers implementing design D3 native-field mappings and precedence, with input types, normalization diagnostics, shared catalog-valid tag processing, author string normalization, allowlisted extension mapping, and reusable native metadata fixtures including conflicting-version scenarios.

The existing `normalizeTags` function now uses the shared `CATALOG_TAG_PATTERN` which extends the standard Backstage catalog tag pattern to also accept dots (`.`), underscores (`_`), and consecutive hyphens. Tags like `rhdh:2.2`, `has_underscore`, and `in--valid` that were previously rejected are now accepted. Downstream consumers that relied on the stricter validation should audit their tag inputs.
