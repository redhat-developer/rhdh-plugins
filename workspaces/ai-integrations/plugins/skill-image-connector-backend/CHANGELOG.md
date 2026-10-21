# @red-hat-developer-hub/backstage-plugin-skill-image-connector-backend

## 0.9.0

### Minor Changes

- 9d074fe: Add durable OCI skill Markdown retention with bounded storage (50 MiB / 1,000 digests per source), monotonic `X-Skilldocs-Revision` header on completed snapshots, and `POST /skilldocs/:sourceId/reconcile` endpoint for provider-authorized acknowledgment with safe cleanup of unreferenced content. The plugin requires its Backstage database service; initialization failures stop startup. Acknowledgments and their exact eligible deletions commit atomically, preserving newer unacknowledged content across restarts.

## 0.8.0

### Minor Changes

- fb9703f: Add authenticated `GET /skilldocs/:sourceId/:digest` endpoint serving extracted OCI skill Markdown with `Content-Type: text/markdown`, digest-derived `ETag`, and `If-None-Match` conditional request support (304). Returns 404 for unknown sources, unknown digests, and unavailable content. Rejects blank and dot/dot-dot source IDs during configuration validation.

## 0.7.0

### Minor Changes

- 42a9ccd: Add authenticated `GET /skills/:sourceId` returning bounded v1 OCI snapshots,
  atomically published by standard Backstage scheduled refreshes (default immediate
  startup and ten-minute frequency). Honor configured initial delays and manual
  trigger mode, enforce local task scope, and replace the unreleased custom refresh
  interval option with `schedule` blocks. Preserve the raw `/images` API independently of metadata
  normalization. Support stable source IDs, isolated redirect-origin configuration,
  and the legacy flat configuration as source `default`. Preserve partial discovery
  results and report known failed repository/tag keys without treating incomplete
  inventories as complete empty success. Digest-only inputs remain raw-only and do
  not alone make normalized snapshots incomplete.

  Keep raw extraction ownership per source and atomically aggregate `/images`
  without duplicate references or cross-source cleanup. Successful references in
  any source are excluded from the aggregate failure list. Warn when explicit
  sources cause legacy flat source fields to be ignored, without logging values.

  Mark retained-content budget failures incomplete even for raw-only digest inputs,
  and explicitly handle ambiguous, non-skill, and inconsistent normalization results.
  Release rejected extraction files and document unknown-source 404 diagnostics.

## 0.6.0

### Minor Changes

- 6e18b27: Harden OCI skill acquisition and extraction bounds: add connection-level DNS validation with pinned Undici dispatchers for registry, discovery, and token requests, initial URL validation, explicit redirect-origin allowlisting, per-image work budget, source operation deadline, 5-redirect cap, 1000-candidate limit, hardened tar parsing, and new configuration options.

## 0.5.0

### Minor Changes

- f135215: Normalize OCI SkillCard and Markdown layouts using shared D3 metadata mappings.

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

## 0.4.1

### Patch Changes

- Updated dependencies [e526768]
  - @red-hat-developer-hub/backstage-plugin-ai-skills-common@0.4.0

## 0.4.0

### Minor Changes

- 6c6aea9: Resolve and pin OCI skill tags to verified content.

  - **Tag-to-digest resolution:** Each mutable tag is resolved once to a SHA-256 manifest digest. All subsequent operations (including retries) use the pinned digest, preventing a moved tag from redirecting to different content mid-acquisition.
  - **Manifest integrity verification:** Raw manifest bytes are verified against the digest before JSON parsing, per the OCI Distribution Spec.
  - **Acquisition metadata:** Tagged acquisitions expose `AcquisitionMetadata` with a stable key (`<lowercase-registry>/<repository>:<tag>`), verified digest, and digest-addressed `sourceUri` (`oci://<registry>/<repository>@sha256:<hex>`). Explicit digest references pass through without tagged identity.
  - **Two-phase retry:** Tag resolution and image extraction each have independent retry scopes, ensuring transient failures after resolution reuse the pinned digest.

  - **Shared contract reuse:** Validate resolved digests and build source URIs with `ai-skills-common`; acquisition metadata uses the shared OCI record field types.
  - **Blob integrity coverage:** Reuse existing descriptor size and digest verification, with acquisition-flow regression tests for corrupted content, moving tags, and retries after resolution.

## 0.3.0

### Minor Changes

- 910c3a6: Discover all active tags in public Quay repositories when `quayDiscovery.tag` is
  omitted or blank. Set `tag: latest` explicitly to retain the previous default;
  other supplied tags remain exact filters. Bound repository and tag pagination
  together, and preserve distinct tagged references even when they share a digest.
  Update shared contract fixtures and documentation for a separate catalog identity
  per valid OCI skill-image tag.

  OCI record producers adopting this contract must construct keys as
  `<registry>/<repository>:<tag>` instead of `<registry>/<repository>`, preserving
  the exact tag case. Consumers with persisted repository-only identities must
  plan for replacement catalog identities and update references when adopting
  tagged keys. The shared hashing algorithm and validators are unchanged: the same
  identity tuple still yields the same catalog name. Upgrading the common library
  alone does not rewrite caller-supplied keys or migrate existing entities.

- 910c3a6: Add public Quay discovery to the OCI skill image connector backend plugin, with optional acquisition tuning and a configurable `skillImageConnector.maxImages` limit (default 25) for combined explicit and discovered image candidates.

## 0.2.0

### Minor Changes

- ef7a4d0: Add skill-image-connector-backend plugin for fetching and extracting OCI skill images
