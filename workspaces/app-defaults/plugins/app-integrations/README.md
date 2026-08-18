# @red-hat-developer-hub/backstage-plugin-app-integrations

RHDH default **SCM integrations** wiring for the **new frontend system**: `scmIntegrationsApiRef` and `scmAuthApiRef`, registered against `pluginId: 'app'`.

## Usage

- **Dynamic loading**: default export is a `FrontendModule` suitable for `@backstage/frontend-dynamic-feature-loader`.
- **Static / alpha**: import from `@red-hat-developer-hub/backstage-plugin-app-integrations/alpha` for `appIntegrationsModule` and `mergeScmAuthFromDeps` (and `ScmAuthFactoryDeps` if you need the same merge logic outside the module).

## Config

Behavior matches the classic RHDH `packages/app` factories: `integrations.github`, `integrations.gitlab`, `integrations.azure`, and `integrations.bitbucket` in app config drive extra `ScmAuth` instances per `host`; if a provider has no entries, a single default `ScmAuth` is registered for that platform OAuth API.

The module depends on the usual app-level OAuth APIs (`githubAuthApiRef`, `gitlabAuthApiRef`, `microsoftAuthApiRef`, `bitbucketAuthApiRef`) already being available in the app.
