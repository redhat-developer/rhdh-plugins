# Developer Sandbox Plugin for Red Hat Developer Hub

This plugin provides the new developer sandbox experience for the Red Hat Developer Hub.

## Configuration

This plugin needs the following to be configured in the `app-config.local.yaml` file:

1. The URL of the registration-service-api production server.
2. The URL of the kube-api production server.
3. The site key for Google Recaptcha. The keys can be obtained from the Google Recaptcha admin console.

```sh
yarn install
yarn dev
```

To generate knip reports for this app, run:

```sh
yarn backstage-repo-tools knip-reports
```

## Development

To start the app locally, run:

1. `cd workspaces/sandbox`
2. `yarn install`
3. `make start-rhdh-local`

Please, note that every time you want to re deploy, you need to run:
`make stop-rhdh-local`

NOTE: the app uses prod RH SSO as auth provider and sandbox stage backend by default
( those can be configured in `app-config.local.yaml` )
