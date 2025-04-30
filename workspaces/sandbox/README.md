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

## Local setup only frontend

To start the UI app only without a backend, run:

```sh
yarn install
yarn dev
```

To generate knip reports for this app, run:

```sh
yarn backstage-repo-tools knip-reports
```

## Local setup frontend + backend

The Sandbox plugin makes usage of RH SSO for authenticating users to the Sandbox backend.
This section provides the steps for connecting your local RHDH sandbox UI app to RH SSO and Sandbox backend ( only stage is supported atm ).

1. Download rhdh-local

```sh
git clone https://github.com/redhat-developer/rhdh-local.git
```

2. Package your local code and copy it to the rhdh-local folder

```sh
cd rhdh-plugins/workspaces/sandbox
npx @janus-idp/cli@latest package package-dynamic-plugins --export-to .
cp -r red-hat-developer-hub-backstage-plugin-sandbox ../../../rhdh-local/local-plugins/
```

3. Start your local dev environment

- Go inside the `rhdh-local` project

```sh
cd rhdh-local
```

- Paste the following content inside `configs/app-config/app-config.local.yaml`:

```yaml
app:
  title: Developer Sandbox
  baseUrl: http://localhost:3000
backend:
  baseUrl: http://localhost:3000
  csp:
    connect-src: ["'self'", 'http:', 'https:']
  listen:
    port: 3000
  cors:
    origin: http://localhost:3000
    methods: [GET, HEAD, PATCH, POST, PUT, DELETE]
    credentials: true
  database:
    client: better-sqlite3
    connection: ':memory:'
auth:
  environment: production
  session:
    secret: 'dummy'
  providers:
    oidc:
      production:
        metadataUrl: https://sso.redhat.com/auth/realms/redhat-external
        clientId: crtoolchain-local
        clientSecret: dummy
        prompt: auto
        signIn:
          resolvers:
            - resolver: emailLocalPartMatchingUserEntityName
              dangerouslyAllowSignInWithoutUserInCatalog: true
signInPage: oidc
sandbox:
  signupAPI: https://registration-service-toolchain-host-operator.apps.rstage.wybr.p1.openshiftapps.com/api/v1
  kubeAPI: https://api-toolchain-host-operator.apps.rstage.wybr.p1.openshiftapps.com
  recaptcha:
    siteKey: 6Lc_164lAAAAAPvrC0WO-XDljvZ2DZ3UQ38A4XR0
```

- Paste the following content in the `configs/dynamic-configs/dynamic-plugins.override.yaml`

```yaml
includes:
  - dynamic-plugins.default.yaml
plugins:
  - disabled: false
    package: ./local-plugins/red-hat-developer-hub-backstage-plugin-sandbox
    pluginConfig:
      dynamicPlugins:
        frontend:
          default.main-menu-items:
            menuItems:
              default.home:
                title: Home
                icon: homeIcon
                to: '/'
                priority: 200
              default.activities:
                title: Activities
                icon: activitiesIcon
                to: '/activities'
                priority: 100
              default.catalog:
                title: ''
              default.apis:
                title: ''
              default.learning-path:
                title: ''
              default.create:
                title: ''
          red-hat-developer-hub.backstage-plugin-sandbox:
            appIcons:
              - name: homeIcon
                importName: SandboxHomeIcon
              - name: activitiesIcon
                importName: SandboxActivitiesIcon
            dynamicRoutes:
              - path: /
                importName: SandboxPage
              - path: /activities
                importName: SandboxActivitiesPage

  # Global Header
  - package: ./dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-global-header
    disabled: false
    pluginConfig:
      dynamicPlugins:
        frontend:
          red-hat-developer-hub.backstage-plugin-global-header:
            mountPoints:
              - mountPoint: application/header
                importName: GlobalHeader
                config:
                  position: above-main-content
              - mountPoint: global.header/component
                importName: Spacer
                config:
                  priority: 99
                  props:
                    growFactor: 1
                    minWidth: 1
              - mountPoint: global.header/component
                importName: ProfileDropdown
                config:
                  priority: 10
              - mountPoint: global.header/profile
                importName: MenuItemLink
                config:
                  priority: 100
                  props:
                    title: Settings
                    link: /settings
                    icon: manageAccounts
              - mountPoint: global.header/profile
                importName: LogoutButton
                config:
                  priority: 10

  # Techdocs
  - package: ./dynamic-plugins/dist/backstage-plugin-techdocs-backend-dynamic
    disabled: true

  - package: ./dynamic-plugins/dist/backstage-plugin-techdocs
    disabled: true

  - package: ./dynamic-plugins/dist/backstage-plugin-techdocs-module-addons-contrib
    disabled: true

  - package: ./dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-dynamic-home-page
    disabled: true
```

- Update the `compose.yaml` to use the right port

Inside `compose.yaml` we need to expose the port `3000` since that is what is configured in RH SSO as _Redirect url_ and _Web Origin_

```yaml
rhdh:
  ports:
    - '3000:3000'
```

- If you are on Mac with `arm64` arch, you'll need to use the nightly build of rhdh-local

Create the `.env` file with the following content:

```shell
# This is an nightly build. This image is available for both amd64 and arm64
RHDH_IMAGE=quay.io/rhdh-community/rhdh:next
```

- Start the containers locally

You'll need to have podman with [podman compose](https://podman-desktop.io/docs/compose) enabled

```sh
podman compose up
```

- Open the UI at [localhost:3000](http://localhost:3000)

NOTE: anytime you build a new local package you'll need to recopy it to the `rhdh-local/local-plugins/` folder and restart the containers. Use `podman-compose down -v` so that also the volumes are cleaned up.
