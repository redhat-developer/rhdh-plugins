# @red-hat-developer-hub/backstage-plugin-skill-image-connector-backend

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
