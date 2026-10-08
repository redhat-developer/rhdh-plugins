---
'@red-hat-developer-hub/backstage-plugin-skill-image-connector-backend': minor
---

Resolve and pin OCI skill tags to verified content.

- **Tag-to-digest resolution:** Each mutable tag is resolved once to a SHA-256 manifest digest. All subsequent operations (including retries) use the pinned digest, preventing a moved tag from redirecting to different content mid-acquisition.
- **Manifest integrity verification:** Raw manifest bytes are verified against the digest before JSON parsing, per the OCI Distribution Spec.
- **Acquisition metadata:** Tagged acquisitions expose `AcquisitionMetadata` with a stable key (`<lowercase-registry>/<repository>:<tag>`), verified digest, and digest-addressed `sourceUri` (`oci://<registry>/<repository>@sha256:<hex>`). Explicit digest references pass through without tagged identity.
- **Two-phase retry:** Tag resolution and image extraction each have independent retry scopes, ensuring transient failures after resolution reuse the pinned digest.
