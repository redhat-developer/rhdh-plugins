# @red-hat-developer-hub/backstage-plugin-x2a

## 1.0.1

### Patch Changes

- 2fc6542: Adding scaffolder software template for creating conversion projects and corresponding action.
- 3c49eed: The Create Project action collects source and target repos. Internally, both are persisted on the Project's level, while the /run endpoints receive fresh (non-expired) tokens only.
- b7862f2: Adding collapsible row detail to the Project List.
- bf9212b: Add module and project status.
- e9964fb: The user prompt is removed except for the project init phase.
- 63d52e6: Renew git repo tokens before submitting run-phase action.
- 8cbf1fd: Aligned the dateTime format with the rest of the RHDH. Added Started At and Finished At module table columns.
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

### Patch Changes

- 11cc305: Enables tests on both the SQLite and PostgreSQL.
- c0449a6: The UI shows projects list with sorting and pagination.
- 2cfc56c: Add configuration for GitHub auth provider in the DEV env
- b3f7edd: Adding full Bacstage instance for development
- 509b858: Adding pagination and filtering by permissions to the GET|POST /projects and GET /project/[id] endpoints.
- aacc903: Added DB tables for Modules and Jobs.
- 8ec9404: Adding a page for empty project list.
- Updated dependencies [80da471]
- Updated dependencies [11cc305]
- Updated dependencies [c0449a6]
- Updated dependencies [2cfc56c]
- Updated dependencies [b3f7edd]
- Updated dependencies [509b858]
- Updated dependencies [aacc903]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.0.0
