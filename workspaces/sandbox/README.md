# Developer Sandbox Plugin for Red Hat Developer Hub

This plugin provides the new developer sandbox experience for the Red Hat Developer Hub.

## Configuration

This plugin needs the following to be configured in the `app-config.yaml` file:

1. The URL of the registration-service-api production server.
2. The URL of the kube-api production server.
3. The site key for Google Recaptcha. The keys can be obtained from the Google Recaptcha admin console.

## Dynamic Plugin Configuration

This is the configuration that needs to be added to the `app-config.yaml` file to enable the sandbox dynamic plugin:

```yaml
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-sandbox:
      appIcons:
        - name: homeIcon
          importName: SandboxHomeIcon
        - name: activitiesIcon
          importName: SandboxActivitiesIcon
      dynamicRoutes:
        - path: /
          importName: SandboxPage
          menuItem:
            icon: homeIcon
            text: Home
        - path: /activities
          importName: SandboxActivitiesPage
          menuItem:
            icon: activitiesIcon
            text: Activities
```

## Development

To start the app, run:

```sh
yarn install
yarn dev
```

To generate knip reports for this app, run:

```sh
yarn backstage-repo-tools knip-reports
```

## Local Frontend Setup (provisional)
The Sandbox plugin uses Red Hat SSO to authenticate users accessing the Sandbox backend. This section explains how to configure your local RHDH Sandbox UI to connect with Red Hat SSO and the Sandbox backend.

0. `export QUAY_NAMESPACE=<your-quay-namespace>`
1. `cd workspaces/sandbox`
2. `yarn install`
3. `make start-rhdh-local`

Please, note that every time you want to re deploy, you need to run:
`make stop-rhdh-local`
