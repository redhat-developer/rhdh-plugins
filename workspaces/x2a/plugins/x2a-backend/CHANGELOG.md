# @red-hat-developer-hub/backstage-plugin-x2a-backend

## 1.4.1

### Patch Changes

- 484583b: Added x2a-list-modules MCP tool listing modules by projectId.
- Updated dependencies [484583b]
  - @red-hat-developer-hub/backstage-plugin-x2a-node@0.2.1

## 1.4.0

### Minor Changes

- ff39f9a: Add x2a-mcp-extras backend plugin exposing MCP tools for AI clients, x2a-dcr frontend plugin for RHDH 1.9 DCR OAuth consent flow, and x2a-node shared node-library. Refactor x2a-backend to use shared service refs from x2a-node via a feature loader.

### Patch Changes

- 1f6770f: Move project directory naming logic from bash to TypeScript Project value object
- 5413f1d: Fix git push for new target branches by tracking branch creation state
- Updated dependencies [ff39f9a]
  - @red-hat-developer-hub/backstage-plugin-x2a-node@0.2.0
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.2.1

## 1.3.1

### Patch Changes

- cc4e98e: Removed blockOwnerDeletion: true from the ownerReference in KubeService.ts. This field is unnecessary for our use case - it only controls whether the garbage collector should block deletion of the owner (Job) until the dependent (Secret) is removed first.

## 1.3.0

### Minor Changes

- 53a0ccf: Bump all dependencies to match RHDH 1.9.3

### Patch Changes

- 76f016c: Improve error propagation in job script: consolidate error handling into run_x2a function with default message and appended error details, add command logging, and refactor publish-aap to use the shared error handler.
- de2a283: Fix SCM token leak in committed files: improve URL credential sanitization regex to handle user:token@host patterns and extend file type coverage to include markdown files
- Updated dependencies [53a0ccf]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.2.0

## 1.2.0

### Minor Changes

- 6f5bfca: Implement sorting by project status.

## 1.1.0

### Minor Changes

- 613b44e: Forced minor version bump.

### Patch Changes

- 50fa945: Adding Project Details Page and fixing issues in the Module Details Page.
- 36a5e1a: Bugfix - failures in git clone and init-phase are propagated to the UI.
- f763734: Split testsuites for better parallelization on local dev machines.
- 7565e2e: Add the Cancel phase migration action.
- e9f35e2: The user can newly bulk-create conversion projects from an uploaded CSV file.
- Updated dependencies [4fb1a6e]
- Updated dependencies [613b44e]
- Updated dependencies [50fa945]
- Updated dependencies [7565e2e]
- Updated dependencies [f3f900e]
- Updated dependencies [5d26b30]
- Updated dependencies [e9f35e2]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.1.0

## 1.0.2

### Patch Changes

- 01999f1: Introducing projects by groups. Additional RBAC hardening.
  - require x2a permissions to access the UI
  - enforce better the x2a permissions on the endpoints
  - projects can be optionally owned by a Backstage group, still defaults to the logged-in user

- Updated dependencies [0c598fb]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.0.2

## 1.0.1

### Patch Changes

- 4465f5c: Adding ModulePage with details, former phase retrigger and logs.
- 3c49eed: The Create Project action collects source and target repos. Internally, both are persisted on the Project's level, while the /run endpoints receive fresh (non-expired) tokens only.
- 4aae07f: Splitting X2ADatabaseService tests into multiple files. Adding coverige for some of the missing flows.
- b7862f2: Adding collapsible row detail to the Project List.
- bf9212b: Add module and project status.
- e9964fb: The user prompt is removed except for the project init phase.
- a97b036: Add GET /projects/:projectId/modules/:moduleId handler
- 877acc1: added GET '/projects/:projectId/modules' endpoint
- f4f63b9: Refactor router for better maintainability - split to multiple files.
- Updated dependencies [2fc6542]
- Updated dependencies [4465f5c]
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
