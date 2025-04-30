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

1. Build and push your local code an OCI image

```sh
cd rhdh-plugins/workspaces/sandbox
npx @janus-idp/cli@3.3.1 package package-dynamic-plugins --tag quay.io/fmuntean/sandbox-plugin:v3 --platform linux/arm64
podman push quay.io/fmuntean/sandbox-plugin:v3
```

Notes:

- you'll have to replace the quay repository path with you're own repo and also adjust the paltform based on your local architecture
- atm only the OCI format of the sandbox plugins seems to be working with rhdh-local, we're still experimenting with having local binary of the plugin without the need to push the OCI image to a remote repository

2. Download rhdh-local

```sh
git clone https://github.com/redhat-developer/rhdh-local.git
```

3. Start your local dev environment

- Go inside the `rhdh-local` project

```sh
cd rhdh-local
```

- Paste the following content inside `configs/app-config.local.yaml`:

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
  recaptcha:
    siteKey: fhgffhgfhjgfhg
```

- Paste the following content in the `configs/dynamic-plugins.yaml`

```yaml
includes:
  - dynamic-plugins.default.yaml
plugins:
  - disabled: false
    package: oci://quay.io/fmuntean/sandbox-plugin:v3!red-hat-developer-hub-backstage-plugin-sandbox
    pluginConfig:
      dynamicPlugins:
        frontend:
          default.main-menu-items:
            menuItems:
              default.home:
                title: Home
                icon: homeIcon
                to: '/home'
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
              default.docs:
                title: ''
          red-hat-developer-hub.backstage-plugin-sandbox:
            appIcons:
              - name: homeIcon
                importName: SandboxHomeIcon
              - name: activitiesIcon
                importName: SandboxActivitiesIcon
            dynamicRoutes:
              - path: /home
                importName: SandboxPage
              - path: /activities
                importName: SandboxActivitiesPage
```

Note: make sure you update the `package` field with the URL of your own quay repository path.

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

NOTE: anytime you push an new image you'll need to update the `configs/dynamic-plugins.yaml` and restart the containers.
