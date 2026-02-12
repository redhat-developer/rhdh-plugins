# @red-hat-developer-hub/backstage-plugin-x2a-backend

## 1.0.1

### Patch Changes

- 3c49eed: The Create Project action collects source and target repos. Internally, both are persisted on the Project's level, while the /run endpoints receive fresh (non-expired) tokens only.
- 4aae07f: Splitting X2ADatabaseService tests into multiple files. Adding coverige for some of the missing flows.
- b7862f2: Adding collapsible row detail to the Project List.
- bf9212b: Add module and project status.
- e9964fb: The user prompt is removed except for the project init phase.
- a97b036: Add GET /projects/:projectId/modules/:moduleId handler
- 877acc1: added GET '/projects/:projectId/modules' endpoint
- f4f63b9: Refactor router for better maintainability - split to multiple files.
- Updated dependencies [2fc6542]
- Updated dependencies [3c49eed]
- Updated dependencies [b7862f2]
- Updated dependencies [bf9212b]
- Updated dependencies [e9964fb]
- Updated dependencies [a97b036]
- Updated dependencies [877acc1]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.0.1

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
