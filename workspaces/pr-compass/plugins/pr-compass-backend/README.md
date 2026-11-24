# PR Compass backend

The PR Compass backend retrieves and aggregates pull requests from registered providers and shows unified view of ranked pull requests that need attention.
It supports SCM source discovery from integrations, and filtering and prioritization of pull requests.

## Installation

Add the backend plugin and at least one module that registers a pull request provider to `packages/backend/src/index.ts`. For example, to use the GitHub provider:

```ts
// packages/backend/src/index.ts
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-pr-compass-backend'),
);
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-pr-compass-backend-module-github'
  ),
);
```

## Prerequisites

1. Configure the Backstage SCM integrations you want to use with PR Compass.
2. Configure the corresponding Backstage OAuth providers to enable users to authenticate with their SCM platforms.

## Configuration

Use `prCompass.maxPullRequests` to limit how many pull requests each source provider gathers per request. The default is `100`.

```yaml
prCompass:
  maxPullRequests: 100
```

## RBAC permissions

The PR Compass backend registers the following permission:

| Name                           | Resource type | Policy | Description                                                             |
| ------------------------------ | ------------- | ------ | ----------------------------------------------------------------------- |
| `pr-compass.pull-request.read` | -             | read   | Allows the user to read pull requests accessible with their SCM tokens. |

## How it works

1. The frontend calls `GET /api/pr-compass/sources` to discover SCM integrations that have a registered pull request provider. The backend checks the GitHub, GitLab, Azure, Bitbucket Cloud, and Bitbucket Server integrations and matches each integration's type to a registered provider.
2. For each source, the frontend uses its `baseUrl` to request the user's credentials from the Backstage `ScmAuthApi`. The source's `baseUrl` comes from the integration `baseUrl` configuration, or from its `host` when no base URL is configured.
3. The frontend sends the available tokens to `GET /api/pr-compass/pull-requests` in the `x-scm-tokens` header as a JSON map from source ID to token. Each source ID identifies an integration by its type and host in the format of `type:host`.
4. The backend passes each token to the matching provider to retrieve pull requests on behalf of the user. It combines and ranks the results, returns the requested page, and reports the outcome for each source. Sources without a token are reported as requiring an SCM session.

## API

### `GET /pull-requests`

Returns a page of pull requests and the outcome for each source. This endpoint requires the `pr-compass.pull-request.read` permission.

| Query      | Meaning                                                 |
| ---------- | ------------------------------------------------------- |
| `page`     | Page number; defaults to `1`.                           |
| `pageSize` | Page size; defaults to `20` and cannot exceed `50`.     |
| `badge`    | Filter by `NeedsReview`, `InProgress`, or `MergeReady`. |

Provide SCM tokens in the `x-scm-tokens` header as a JSON-encoded map from source ID to token:

```text
X-SCM-Tokens: {"github:github.com":"ghu_..."}
```

| Response field     | Meaning                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `items`            | Pull requests on the requested page.                                  |
| `page`, `pageSize` | Page information.                                                     |
| `total`            | Total number of gathered pull requests after filtering.               |
| `sources`          | Per-source outcome, including truncation or an error when applicable. |

A source without a token is reported with `SCM_SESSION_REQUIRED`, and a provider failure is reported with `FETCH_FAILED`. Tokens for unknown sources are ignored. When no providers are registered, the response contains no source statuses. Other error codes are reserved for more specific failures.

### `GET /sources`

Lists SCM sources with both an integration and a registered pull request provider. The frontend can use these sources to determine which credentials to request.

```json
{
  "sources": [
    {
      "id": "github:github.com",
      "type": "github",
      "host": "github.com",
      "title": "github.com",
      "baseUrl": "https://github.com"
    }
  ]
}
```

The `id` has the format `type:host` and is used as the key in `x-scm-tokens`. The `baseUrl` is used to obtain credentials through `ScmAuthApi`.

## Badges

Pull requests are sorted by badge in the order below, then by most recently updated within each badge.

| Badge         | Title            | Meaning                                                |
| ------------- | ---------------- | ------------------------------------------------------ |
| `NeedsReview` | Needs your input | You still owe a review on the pull request.            |
| `InProgress`  | In progress      | The pull request is moving, but is not waiting on you. |
| `MergeReady`  | Merge-ready      | The pull request is approved and mergeable.            |
