# [Backstage](https://backstage.io)

RHDH **app-defaults** workspace: sample new-frontend-system app plus shared plugins (`app-react`, `app-auth`, `app-integrations`).

## Local app shell

To start the app from this directory:

```sh
yarn install
yarn start
```

### Static `app-auth` wiring

The sample app in [`packages/app`](packages/app) loads RHDH sign-in and OIDC/Auth0/SAML frontend APIs by importing **`appAuthModule`** from `@red-hat-developer-hub/backstage-plugin-app-auth/alpha` and passing it to `createApp({ features: [...] })`. That mirrors how you can mount the module **statically** for local development and tests.

In **RHDH**, the same module is intended to be loaded **dynamically** via `@backstage/frontend-dynamic-feature-loader` and your export/overlays pipeline—not by editing the product `app-next` shell.

### Static `app-integrations` wiring

The sample app imports **`appIntegrationsModule`** from `@red-hat-developer-hub/backstage-plugin-app-integrations/alpha` and adds it to `createApp({ features: [...] })` (after `appAuthModule`). It registers **`scmIntegrationsApiRef`** and **`scmAuthApiRef`** on `pluginId: 'app'`, matching the classic RHDH [`packages/app` `apis.ts`](https://github.com/redhat-developer/rhdh/blob/main/packages/app/src/apis.ts) SCM factories—so catalog import, scaffolder, and similar features get the same default SCM auth behavior.

Deployments that want different SCM wiring can omit this module and supply their own dynamic (or static) module that registers those refs instead.

In **RHDH**, this module is expected to ship and load **dynamically** alongside `app-auth`, not via edits to `app-next`.

### Config for `app-auth`

- **`auth.environment`**: set to `development` locally so the RHDH sign-in page includes the **guest** provider (needed for [`App.test.tsx`](packages/app/src/App.test.tsx) inline `APP_CONFIG`, [`app-config.yaml`](app-config.yaml) for `yarn start` / Playwright, and typical dev flows).
- **`signInPage`** (optional, root key): string or list of provider ids (e.g. `github`, `oidc`) for the RHDH multi-provider sign-in page. Schema lives on the `backstage-plugin-app-auth` package.

## Other commands

To generate knip reports for this app, run:

```sh
yarn backstage-repo-tools knip-reports
```
