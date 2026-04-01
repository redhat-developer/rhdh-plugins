# @red-hat-developer-hub/backstage-plugin-x2a

## 1.1.1

### Patch Changes

- f68510b: Icon for the X2A left side menu.

## 1.1.0

### Minor Changes

- 613b44e: Forced minor version bump.

### Patch Changes

- 079e654: Fix alignment and wrapping of module and status with icons.
- 4fb1a6e: Bulk run project action added. Filters eligible projects based on privileges.
- cd887eb: Fixing alignment of the external link icon. Sprucing up the git branch icon. Rearranging the description field.
- 50fa945: Adding Project Details Page and fixing issues in the Module Details Page.
- f7f1512: Unify relative time formatters and internationalize them.
- 78f3533: Add icon for external links.
- 2a5a9e3: Reduce the amount of details in the project list and improve user's navigation to review.
- 1e8abd2: The user can newly retrigger the project's init phase.
- 2bf13d3: Adding summary to the RepoAuthentication widget.
- 6876289: Add the Delete project action to the project detail page.
- f763734: Split testsuites for better parallelization on local dev machines.
- bae8cf4: Add bulk caret expanding/collapsing all ProjectList rows.
- 7565e2e: Add the Cancel phase migration action.
- f3f900e: feat(x2a): introduce polling to keep the views up-to-date (affects multiple pages)
- 5d26b30: Add Bitbucket repository support.
- e81c2ba: Rearrange the ModulePage grid items to make the artifacts and details card more readable.
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

- 4377735: Project status is aligned if module summary is empty (while Initializing)
- 01999f1: Introducing projects by groups. Additional RBAC hardening.
  - require x2a permissions to access the UI
  - enforce better the x2a permissions on the endpoints
  - projects can be optionally owned by a Backstage group, still defaults to the logged-in user

- 0c598fb: Add GitLab support.
- Updated dependencies [0c598fb]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.0.2

## 1.0.1

### Patch Changes

- 2fc6542: Adding scaffolder software template for creating conversion projects and corresponding action.
- 4465f5c: Adding ModulePage with details, former phase retrigger and logs.
- 3c49eed: The Create Project action collects source and target repos. Internally, both are persisted on the Project's level, while the /run endpoints receive fresh (non-expired) tokens only.
- b7862f2: Adding collapsible row detail to the Project List.
- bf9212b: Add module and project status.
- e9964fb: The user prompt is removed except for the project init phase.
- 63d52e6: Renew git repo tokens before submitting run-phase action.
- 8cbf1fd: Aligned the dateTime format with the rest of the RHDH. Added Started At and Finished At module table columns.
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
