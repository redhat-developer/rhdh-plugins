# CSV Bulk Project Import

The CSV bulk import lets the user create multiple conversion projects at once by uploading a single CSV file.

## How to Access

1. Open the Backstage instance and navigate to `/create`.
2. Select the **Chef-to-Ansible Conversion Project** template (`chef-conversion-project-template`).
3. On the first page, choose **CSV upload** as the input method.
4. Upload the CSV file and proceed through the wizard.

The wizard asks for authentication with each SCM provider (GitHub, GitLab, Bitbucket) referenced in the CSV. Projects are created sequentially with the same permission checks as if the user had created each one individually.

## CSV File Format

The file must be UTF-8 encoded with a header row. Column order does not matter, but header names must match exactly.

### Required Columns

| Column             | Description                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `name`             | Unique project name                                                                                       |
| `abbreviation`     | Short project identifier, 1-5 alphanumeric characters matching `^([a-zA-Z][a-zA-Z0-9]*)(-[a-zA-Z0-9]+)*$` |
| `sourceRepoUrl`    | URL of the repository containing the Chef cookbook to convert                                             |
| `sourceRepoBranch` | Branch to read from in the source repository                                                              |
| `targetRepoBranch` | Branch to write converted Ansible output to                                                               |

### Optional Columns

| Column          | Description                                                                              |
| --------------- | ---------------------------------------------------------------------------------------- |
| `description`   | Project description (defaults to empty)                                                  |
| `ownedByGroup`  | Backstage group that owns the project. When empty, the signed-in user becomes the owner. |
| `targetRepoUrl` | Repository for converted output. Defaults to `sourceRepoUrl` when empty.                 |

No extra columns are allowed -- the import will reject unknown headers.

### Repeatable Import

The CSV import is designed to be run repeatedly with the same or an updated file. Projects whose name already exists are **skipped** (not duplicated) and counted as "skipped" in the results summary.

A typical workflow for a large import:

1. Upload the CSV. Some projects succeed, some may fail (e.g. due to a missing repository or a typo).
2. Review the results. The summary shows how many succeeded, failed, and were skipped.
3. Fix the issues - correct the CSV rows that failed and, if a partially-created project needs to be recreated, delete it from the application first.
4. Re-upload the corrected CSV. Already-created projects are skipped automatically. Only the new or corrected rows are processed.

### Repository URL Format

Both `sourceRepoUrl` and `targetRepoUrl` accept two formats. All URLs are normalized to HTTPS clone URLs before being stored.

**Plain HTTPS URLs** (standard clone URLs):

| Provider  | Format                                 |
| --------- | -------------------------------------- |
| GitHub    | `https://github.com/owner/repo`        |
| GitLab    | `https://gitlab.com/owner/repo`        |
| Bitbucket | `https://bitbucket.org/workspace/repo` |

**Backstage RepoUrlPicker format** (query-parameter style, without `https://`):

| Provider  | Format                                                           |
| --------- | ---------------------------------------------------------------- |
| GitHub    | `github.com?owner=myuser&repo=myrepo`                            |
| GitLab    | `gitlab.com?owner=myuser&repo=myrepo`                            |
| Bitbucket | `bitbucket.org?workspace=myworkspace&project=myproj&repo=myrepo` |

For Bitbucket, the `project` parameter is organizational metadata and is not part of the clone URL. Only `workspace` and `repo` are used.

For self-hosted instances (e.g. GitHub Enterprise, self-hosted GitLab), the corresponding host should be used in place of the public domain. The host must be listed in the `integrations:` section of `app-config.yaml` so the plugin can detect the correct SCM provider. See [SCM Provider Detection](../README.md#scm-provider-detection).

### Example

```csv
name,abbreviation,sourceRepoUrl,sourceRepoBranch,targetRepoUrl,targetRepoBranch,description,ownedByGroup
web-app,wapp,https://github.com/myorg/web-app-chef,main,https://github.com/myorg/web-app-ansible,main,Convert web app cookbook,team-platform
db-setup,dbset,gitlab.com?owner=myorg&repo=db-chef,develop,gitlab.com?owner=myorg&repo=db-ansible,main,,
cache-svc,cache,bitbucket.org?workspace=myws&project=x2a&repo=cache-chef,main,,main,Cache service conversion,
```

Notes on the example:

- Row 1 (`web-app`): uses plain HTTPS URLs.
- Row 2 (`db-setup`): uses RepoUrlPicker-style URLs for GitLab. `description` and `ownedByGroup` are left empty.
- Row 3 (`cache-svc`): uses RepoUrlPicker-style URL for Bitbucket. `targetRepoUrl` is empty, so the source repository is used as the target.

### CSV file template

Download a [sample CSV file](../plugins/x2a-backend/public/sample-projects.csv) with all supported headers.

At runtime, the file is served at `/x2a/download/sample-projects.csv` (via the frontend plugin route).

## RepoAuthentication Scaffolder Extension

When using CSV import, the template uses the `RepoAuthentication` custom scaffolder field to collect OAuth tokens for each SCM provider found in the CSV. This replaces the standard `RepoUrlPicker` used in manual mode.

### How It Works

1. The extension parses the uploaded CSV and identifies all distinct SCM providers across source and target URLs.
2. It opens an OAuth dialog for each provider for the user to authenticate.
3. Tokens are stored as scaffolder secrets with the prefix `OAUTH_TOKEN_` (e.g. `OAUTH_TOKEN_github`, `OAUTH_TOKEN_gitlab`, `OAUTH_TOKEN_bitbucket`).
4. The wizard blocks progression until all required providers are authenticated.

### Using in a Template

The extension is registered as `RepoAuthentication` and is available as a `ui:field`. It must reference the CSV field via `ui:options.csvFieldName`:

```yaml
properties:
  repoAuthentication:
    type: string
    description: Provide login to all the SCMs relevant for the source CSV.
    ui:field: RepoAuthentication
    ui:options:
      csvFieldName: csvContent
```

### Registering the Extension

In a standard Backstage app, import and add the extension so the scaffolder can find it:

```typescript
import { RepoAuthenticationExtension } from '@red-hat-developer-hub/backstage-plugin-x2a';

// In the App component, alongside <ScaffolderPage>:
<ScaffolderFieldExtensions>
  <RepoAuthenticationExtension />
</ScaffolderFieldExtensions>
```

For Red Hat Developer Hub (RHDH) with dynamic plugins, the extension is registered via configuration instead. See [Providing custom Scaffolder field extensions](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.9/html/installing_and_viewing_plugins_in_red_hat_developer_hub/assembly-front-end-plugin-wiring.adoc_rhdh-extensions-plugins#con-providing-custom-scaffolder-field-extensions.adoc_assembly-front-end-plugin-wiring) in the RHDH documentation.
