# Tasks: OCI and npx Skills Catalog Providers

## 1. Shared provider utilities

- [ ] 1.1 Implement typed `AiResource` construction with upstream
  `spec.type: skill`, source location, AI Catalog annotations, and configured
  owner/lifecycle defaults.
- [ ] 1.2 Implement stable source-based identity and normalized fallback
  version `0.0.0+<short-content-digest>`.
- [ ] 1.3 Persist last-known-good source state and support delta mutations.
- [ ] 1.4 Add structured per-provider counters and contextual error logs.

## 2. OCI skills provider

- [ ] 2.1 Implement public Quay organization/repository discovery with
  pagination and configured tag selection (`latest` by default).
- [ ] 2.2 Resolve tags to digests, fetch manifests by digest, and validate the
  returned content digest.
- [ ] 2.3 Identify OCTO skillimages and map manifest annotations to entities
  without layer extraction.
- [ ] 2.4 Retain last-known-good entities for transient per-repository errors.

## 3. npx skills provider

- [ ] 3.1 Implement Agent Skills v0.2 discovery-index retrieval and validation.
- [ ] 3.2 Process `skill-md` entries only; safely retrieve and SHA-256 verify
  each artifact before mapping known frontmatter fields.
- [ ] 3.3 Enforce source-origin, redirect, size, timeout, and concurrency
  limits.
- [ ] 3.4 Retain last-known-good entities for transient per-skill errors.

## 4. Configuration and verification

- [ ] 4.1 Define static `app-config.yaml` schemas for provider ID, source,
  catalog namespace, defaults, tag, and sync interval.
- [ ] 4.2 Add focused unit and integration tests for valid sources, malformed
  metadata, integrity mismatch, disappearance, and transient errors.
- [ ] 4.3 Document demo-only and public-source-only constraints.
