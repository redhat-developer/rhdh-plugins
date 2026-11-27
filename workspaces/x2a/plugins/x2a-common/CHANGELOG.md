# @red-hat-developer-hub/backstage-plugin-x2a-common

## 2.1.0

### Minor Changes

- 5a6d789: Show migration progress, module errors, and token totals for the projects a user can already see, and sort the Conversion Hub table by modules in error.
- aa44c81: Bump minor after the release-2.1 cut so main patch versions do not collide with the maintenance line on npm.
- a2facc9: Add the `X2ARepoUrlPicker` scaffolder field and use it in the conversion project template, so
  conversions work against SCM instances on custom URLs (self-hosted GitLab, GitHub Enterprise).

  It renders the stock Backstage `RepoUrlPicker` and replaces two upstream behaviours that break
  on custom hosts:
  - `allowedHosts` defaults to the GitHub and GitLab hosts configured under `integrations:` plus
    `bitbucket.org`, instead of requiring a hard-coded list in the template. An explicit
    `allowedHosts` in a template still takes precedence. Bitbucket Cloud is supported with
    workspace and project inputs.
  - `requestUserCredentials` is still handled by the stock picker (so owner/repository
    autocomplete works), but inside a scope where `scmAuthApi` delegates to the app's
    `scmAuthApi` behind the `x2a.scm.authHosts` host guard. RHDH 1.10 or later maps every
    `integrations:` host to the provider's auth API; other apps must register `ScmAuth` for
    their hosts. Scopes are those of the app's `scmAuthApi` (GitLab OAuth apps must allow
    `api`). The secret is cleared when the host changes. The option gains a `readOnly` flag
    (passed as `repoWrite`, honoured by GitLab and Bitbucket); `additionalScopes` is forwarded
    as in the stock picker.

  **BREAKING:** SCM access tokens are now bound to one host per provider type. After upgrading,
  set `x2a.scm.authHosts.github` / `x2a.scm.authHosts.gitlab` to the host each OAuth provider is
  registered against (GitLab `audience`, GitHub `enterpriseInstanceUrl`; Bitbucket Cloud is always
  `bitbucket.org`). There is no default, not even for github.com or gitlab.com: until the key is
  set, running phases, bulk runs, the CSV bulk import and the repository picker refuse every host
  of that type with an error naming the missing key.

  Backstage auth providers are configured once per provider type, so the access token they issue
  is valid for a single host only. A token is now only handed to the host in `x2a.scm.authHosts`,
  in the picker and in every other place that obtains SCM tokens, instead of being sent to another
  host of the same type. With credentials requested, the picker offers only that host and says
  which configured hosts it left out and why. The value may be a bare host or a URL, so the GitLab
  `audience` can be copied as is. Keep `x2a.scm.authHosts` in sync with the auth provider config;
  it cannot be verified from the frontend.

  Repository URLs (CSV rows, stored projects) must be plain `https://` URLs without credentials,
  backslashes or whitespace; others are refused before any token is requested. `extractHost` and
  the stricter `extractAuthHost` are now exported from the common package.
  `normalizeRepoUrl` no longer rewrites a full URL that carries `owner`/`repo` query parameters.

  Azure, Gerrit, Gitea and Bitbucket Server hosts are deliberately not offered; x2a has no
  provider implementation for them.

  Deployments that register the plugin's scaffolder field extensions by configuration
  (RHDH dynamic plugins) must add `X2ARepoUrlPickerExtension` to `scaffolderFieldExtensions`.
  If the extension is missing, the template's repository fields silently degrade to plain text
  inputs.

### Patch Changes

- c1ea707: Add an Edit in Codespaces action beside GitHub migrated sources, using the target branch and Ansible devcontainer configuration. Copy the generated Ansible devcontainer configuration into the target repository and include it in the migration commit. Also match Ansible role-name sanitization in migration jobs and prefer rebased job output when resolving repository conflicts.
- 1f60858: Enforce rule content limits: max 50,000 characters per rule description, and max 50,000 total characters across all rules accepted by a project

## 2.0.1

### Patch Changes

- 6db5c1d: implemented adversarial agents
- 3bf5e1b: Downstream phase jobs are automatically marked as stale when an upstream phase completes successfully.

## 2.0.0

### Major Changes

- 20421e9: Updating x2a plugins to RHDH 1.10, including NFS for testing.

## 1.4.0

### Minor Changes

- 2a40df0: The user can newly update the project migration plan in an external flow and then let the X2A resync the module list changes.

### Patch Changes

- 9cc09db: Show attempt counter for repeated executions of phases.

## 1.3.0

### Minor Changes

- e887fb4: Added "Edit project" action.
- f13f2c5: feat(x2a): Add `Rules` API

  This add a way to create into the init phase the x2a-rules introduced on x2a-convertor, and take advantage of the INPUT-AGENTS.md and EXPORT-AGENTS.md

  Summary of Changes:
  - New /rules/ api endpoints. (only admin can add it)
  - New Configmap on init phase.
  - Small changes on the script template.
  - New MCP tool to list all rules: x2a-list-rules (Also updated the project create)
  - Change on CSV to support rules.

### Patch Changes

- 7a130c5: Extract `ArtifactKind` value object to replace raw artifact-type string comparisons, fragile casts, and duplicated Zod enums.
- daaea27: Changed the project to be source-technology agnostic. Rephrasing all texts from being Chef-oriented to more generic variants. There is explicit mapping from free-form agentic findings to the new SourceTechnology enum (normalizeSourceTechnology.ts).
- 8d71b85: Removing Abbreviation from project's details. Replaced by project directory calculated from the project's name.

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
