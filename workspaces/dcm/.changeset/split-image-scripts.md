---
'@red-hat-developer-hub/backstage-plugin-dcm': patch
'@red-hat-developer-hub/backstage-plugin-dcm-backend': patch
'@red-hat-developer-hub/backstage-plugin-dcm-common': patch
---

Split image generation into dedicated OCI and Docker scripts with an interactive entrypoint.

`generate-image.sh` now prompts for image type and version (or accepts `oci|docker <version>`). OCI builds always push `:VERSION` and tag `:latest` via skopeo; Docker builds always push `:VERSION` and `:main`.
