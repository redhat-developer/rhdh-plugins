# Developing the PR Compass backend

Contributor notes for `@red-hat-developer-hub/backstage-plugin-pr-compass-backend`. For installation and configuration, see [README.md](./README.md).

## Prerequisites

Use Node 22 or 24 and install dependencies with `yarn install` from `workspaces/pr-compass`.

## Local harness

The package's `dev/index.ts` starts a backend with mocked authentication and fixture providers for GitHub and GitLab. The providers return fixed pull requests covering all three badges without contacting an SCM. The token values in `X-SCM-Tokens` are ignored.

From `workspaces/pr-compass`, start the harness:

```sh
yarn workspace @red-hat-developer-hub/backstage-plugin-pr-compass-backend start
```

The harness loads the package's `app-config.yaml` and listens on port 7007. Stop it with Ctrl-C. To exercise truncation, set `prCompass.maxPullRequests` below 3 in the harness configuration; the limit applies per source.

Mocked authentication accepts the Backstage mock user token. The read permission is allowed by default. List the available sources with:

```sh
curl -sS -H 'Authorization: Bearer mock-user-token' \
  http://localhost:7007/api/pr-compass/sources
```

Fetch pull requests by providing a token for each source. The values can be placeholders in this harness:

```sh
curl -sS \
  -H 'Authorization: Bearer mock-user-token' \
  -H 'X-SCM-Tokens: {"github:github.com":"dummy","gitlab:gitlab.com":"dummy"}' \
  'http://localhost:7007/api/pr-compass/pull-requests?pageSize=5'
```

Filter by badge and request the second page:

```sh
curl -sS \
  -H 'Authorization: Bearer mock-user-token' \
  -H 'X-SCM-Tokens: {"github:github.com":"dummy","gitlab:gitlab.com":"dummy"}' \
  'http://localhost:7007/api/pr-compass/pull-requests?badge=NeedsReview&page=2&pageSize=1'
```

A source omitted from `X-SCM-Tokens` is reported with `SCM_SESSION_REQUIRED`; unknown source IDs are ignored.

## Tests

From `workspaces/pr-compass`:

```sh
yarn workspace @red-hat-developer-hub/backstage-plugin-pr-compass-backend test --watch=false
yarn workspace @red-hat-developer-hub/backstage-plugin-pr-compass-backend lint
```

Run `yarn tsc` from the workspace root to type-check the whole workspace.

## When this harness is not enough

The workspace's `packages/app` and `packages/backend` provide a Backstage app with the PR Compass backend. Start them from `workspaces/pr-compass` with `yarn start`. No pull request provider is registered by default, so the sources list is empty until a provider module is added.

To use a real provider with the backend harness, add its module as a development dependency, register it in `dev/index.ts` in place of the fixture providers, and configure its SCM integration in the harness `app-config.yaml`. Supply a real user token with the necessary repository permissions in `X-SCM-Tokens`.

Testing permissions requires Backstage app. The standalone harness uses mock authentication, does not provide `/api/auth/guest/refresh`, and allows the read permission by default.

### Testing permissions

These steps require the workspace app and backend started.

In the workspace app, the guest user can manage roles at `/rbac` but does not automatically have `pr-compass.pull-request.read`. Create a role for `user:development/guest` and grant that permission to allow listing pull requests. Remove the permission to test the denied response.

To call the endpoint as the guest user, obtain a Backstage token and use it in the request:

```sh
PR_COMPASS_GUEST_TOKEN=$(curl -fsS -H 'X-Requested-With: XMLHttpRequest' \
  'http://localhost:7007/api/auth/guest/refresh' | \
  node -p 'JSON.parse(require("fs").readFileSync(0, "utf8")).backstageIdentity.token')
curl -i -H "Authorization: Bearer ${PR_COMPASS_GUEST_TOKEN}" \
  http://localhost:7007/api/pr-compass/pull-requests
```

The request returns `403` without the permission and `200` when allowed. Without a registered provider, the successful response contains no pull requests or sources.
