# @red-hat-developer-hub/backstage-plugin-x2a-backend

## 1.0.0

### Major Changes

- 80da471: Initial commit

### Minor Changes

- 1ba6994: Implemented Job Resource with Kubernetes integration, including:
  - Job database table with phase tracking and project/module associations
  - REST API endpoints for running init/analyze/migrate/publish phases
  - Kubernetes Job and Secret resource management via KubeService
  - Two-secret architecture for project and job credentials
  - Configuration support via app-config.yaml with environment variable substitution
  - Default LLM_MODEL fallback constant

### Patch Changes

- 11cc305: Enables tests on both the SQLite and PostgreSQL.
- c0449a6: The UI shows projects list with sorting and pagination.
- 2cfc56c: Add configuration for GitHub auth provider in the DEV env
- b3f7edd: Adding full Bacstage instance for development
- 509b858: Adding pagination and filtering by permissions to the GET|POST /projects and GET /project/[id] endpoints.
- aacc903: Added DB tables for Modules and Jobs.
- Updated dependencies [80da471]
- Updated dependencies [11cc305]
- Updated dependencies [c0449a6]
- Updated dependencies [2cfc56c]
- Updated dependencies [b3f7edd]
- Updated dependencies [509b858]
- Updated dependencies [aacc903]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.0.0
