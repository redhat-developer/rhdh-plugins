# @red-hat-developer-hub/backstage-plugin-x2a-common

## 1.2.1

### Patch Changes

- ff39f9a: Add x2a-mcp-extras backend plugin exposing MCP tools for AI clients, x2a-dcr frontend plugin for RHDH 1.9 DCR OAuth consent flow, and x2a-node shared node-library. Refactor x2a-backend to use shared service refs from x2a-node via a feature loader.

## 1.2.0

### Minor Changes

- 53a0ccf: Bump all dependencies to match RHDH 1.9.3

## 1.1.0

### Minor Changes

- 613b44e: Forced minor version bump.

### Patch Changes

- 4fb1a6e: Bulk run project action added. Filters eligible projects based on privileges.
- 50fa945: Adding Project Details Page and fixing issues in the Module Details Page.
- 7565e2e: Add the Cancel phase migration action.
- f3f900e: feat(x2a): introduce polling to keep the views up-to-date (affects multiple pages)
- 5d26b30: Add Bitbucket repository support.
- e9f35e2: The user can newly bulk-create conversion projects from an uploaded CSV file.

## 1.0.2

### Patch Changes

- 0c598fb: Add GitLab support.

## 1.0.1

### Patch Changes

- 2fc6542: Adding scaffolder software template for creating conversion projects and corresponding action.
- 4465f5c: Adding ModulePage with details, former phase retrigger and logs.
- 3c49eed: The Create Project action collects source and target repos. Internally, both are persisted on the Project's level, while the /run endpoints receive fresh (non-expired) tokens only.
- b7862f2: Adding collapsible row detail to the Project List.
- bf9212b: Add module and project status.
- e9964fb: The user prompt is removed except for the project init phase.
- a97b036: Add GET /projects/:projectId/modules/:moduleId handler
- 877acc1: added GET '/projects/:projectId/modules' endpoint

## 1.0.0

### Major Changes

- 80da471: Initial commit

### Patch Changes

- 11cc305: Enables tests on both the SQLite and PostgreSQL.
- c0449a6: The UI shows projects list with sorting and pagination.
- 2cfc56c: Add configuration for GitHub auth provider in the DEV env
- b3f7edd: Adding full Bacstage instance for development
- 509b858: Adding pagination and filtering by permissions to the GET|POST /projects and GET /project/[id] endpoints.
- aacc903: Added DB tables for Modules and Jobs.
