# @red-hat-developer-hub/backstage-plugin-app-auth

RHDH sign-in page (multi-provider) and OIDC / Auth0 / SAML frontend OAuth2 APIs for the **new frontend system**, registered against `pluginId: 'app'`.

## Usage

- **Dynamic loading**: default export is a `FrontendModule` suitable for `@backstage/frontend-dynamic-feature-loader`.
- **Static / alpha**: import from `@red-hat-developer-hub/backstage-plugin-app-auth/alpha` for `appAuthModule`, `SignInPage`, `signInTranslationRef`, and auth API refs.

## Config

Root `signInPage` (string or string[]) selects which providers appear; see `config.d.ts`.
