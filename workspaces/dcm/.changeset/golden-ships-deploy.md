---
'@red-hat-developer-hub/backstage-plugin-dcm': patch
'@red-hat-developer-hub/backstage-plugin-dcm-backend': patch
'@red-hat-developer-hub/backstage-plugin-dcm-common': patch
---

Add Docker/Podman deployment support for the DCM plugin.

- Added `Dockerfile` (multi-stage build) to produce a standalone Backstage image
- Added `app-config.production.yaml` for container runtime configuration
- Added `scripts/generate-image.sh` (renamed from `dynamic-plugins.sh`) with commands to build and push both the OCI dynamic-plugin artifact and the full Backstage application image
- Added `.dockerignore` to exclude sensitive and dev-only files from the build context
- Configured guest auth (`dangerouslyAllowOutsideDevelopment`) for container environments
- Skip SSO token exchange in the backend proxy when `clientId`/`clientSecret` are not set
