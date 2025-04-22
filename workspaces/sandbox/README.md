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
