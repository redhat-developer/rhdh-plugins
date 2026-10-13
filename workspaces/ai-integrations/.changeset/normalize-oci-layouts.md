---
'@red-hat-developer-hub/backstage-plugin-skill-image-connector-backend': minor
---

Normalize OCI SkillCard and Markdown layouts using shared D3 metadata mappings.

Parse extracted SkillCard YAML and Markdown frontmatter, invoke the shared
`normalizeOciMetadata()` normalizer with trusted acquisition metadata, and
classify each candidate as normalized, non-skill, ambiguous, or malformed.

Detect competing skill file matches across annotated and tar layers per the
D4 exactly-one-file-pair rule. Non-skill images are silently skipped rather
than treated as errors. Valid skillctl images without manifest metadata
annotations are supported via the existing tar extraction path.

Support valid file pairs split between annotated raw layers and archives. Reject
competing matches across layouts, entries, and archive layers. Malformed or
unclosed Markdown frontmatter is distinguished from absent optional frontmatter
and produces normalization diagnostics. Preserve raw `/images` responses and
explicit digest acquisition; no snapshot endpoint or scheduling is introduced.

Frontmatter diagnostics retain validation reasons or YAML syntax codes and line/column positions without including raw source excerpts. Remove unused normalization-result constructors.
