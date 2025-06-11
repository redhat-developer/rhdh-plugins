# Lightspeed plugin for Backstage

The Lightspeed plugin enables you to interact with any LLM server running a model with OpenAI's API compatibility.

## For administrators

### Prerequisites

- Follow the lightspeed backend plugin [README](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/lightspeed/plugins/lightspeed-backend/README.md) to integrate lightspeed backend in your Backstage instance.

**Note**

### Permission Framework Support

The Lightspeed plugin has support for the permission framework.

- When [RBAC permission](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac-backend#installation) framework is enabled, for non-admin users to access lightspeed UI, the role associated with your user should have the following permission policies associated with it. Add the following in your permission policies configuration file named `rbac-policy.csv`:

```CSV
p, role:default/team_a, lightspeed.conversations.read, read, allow
p, role:default/team_a, lightspeed.conversations.create, create, allow
p, role:default/team_a, lightspeed.conversations.delete, delete, allow

g, user:default/<your-user-name>, role:default/team_a

```

You can specify the path to this configuration file in your application configuration:

```yaml
permission:
  enabled: true
  rbac:
    policies-csv-file: /some/path/rbac-policy.csv
    policyFileReload: true
```

### Installation

1. Install the Lightspeed plugin using the following command:

   ```console
   yarn workspace app add @red-hat-developer-hub/backstage-plugin-lightspeed
   ```

### Configuration

1. Add a new nav item **Lightspeed** in App `packages/app/src/App.tsx`:

   ```tsx title="packages/app/src/components/App.tsx"
   /* highlight-add-next-line */ import { LightspeedPage } from '@red-hat-developer-hub/backstage-plugin-lightspeed';

   <Route path="/lightspeed" element={<LightspeedPage />} />;
   ```

2. Enable **Lightspeed** page in `packages/app/src/components/Root/Root.tsx`:

   ```tsx title="packages/app/src/components/Root/Root.tsx"
   /* highlight-add-next-line */ import { LightspeedIcon } from '@red-hat-developer-hub/backstage-plugin-lightspeed';

   <SidebarItem
     icon={LightspeedIcon as IconComponent}
     to="lightspeed"
     text="Lightspeed"
   />;
   ```

## For users

### Using the Lightspeed plugin in Backstage

Lightspeed is a front-end plugin that enables you to interact with any LLM server running a model with OpenAI's API compatibility.

#### Prerequisites

- Your Backstage application is installed and running.
- You have installed the Lightspeed plugin. For installation process, see [Installation](#installation).

#### Procedure

1. Open your Backstage application and select a Lightspeed nav item from the **Navigation**.
2. Ask you questions to the Lightspeed chatbot.

## Loading as Dynamic Plugin

#### To install Lightspeed plugin into Red Hat Developer Hub or Janus IDP via Helm use this configuration:

- Load the lightspeed plugin from the npm registry

```
global:
  dynamic:
    includes:
      - dynamic-plugins.default.yaml
    plugins:
      - package: '@red-hat-developer-hub/backstage-plugin-lightspeed@0.1.2'
        integrity: >-
          sha512-bCKETjVhjZFLx7ImSFcptA3yvwJhFLFTFhMo/LvdVc0K5E76/SpEEkYBPup4aEQMivZBJKn0iVQFBuduChCDpA==
        disabled: false
        pluginConfig:
          dynamicPlugins:
            frontend:
              red-hat-developer-hub.backstage-plugin-lightspeed:
                appIcons:
                  - name: LightspeedIcon
                    module: LightspeedPlugin
                    importName: LightspeedIcon
                dynamicRoutes:
                  - path: /lightspeed
                    importName: LightspeedPage
                    module: LightspeedPlugin
                    menuItem:
                      icon: LightspeedIcon
                      text: Lightspeed
```

- add the lightspeed configuration in the `app-config.yaml`

```
lightspeed:
  servers:
    - id: <server_id>
      url: <server_URL>
      token: <api_key>
  questionValidation: true # Optional - To disable question (prompt) validation set it to false.
  prompts: # optional
    - title: <prompt_title>
    - message: <prompt_message>
```

`questionValidation` is default to be enabled with topic restriction on RHDH related topics.
If you want to disable the validation, set the value to be `false`.

Example configuration to disable `questionValidation`:

```yaml
lightspeed:
  questionValidation: false
  servers: ... ...
```

---

#### To install this plugin locally in [backstage-showcase](https://github.com/janus-idp/backstage-showcase) application as a dynamic plugin.

Follow the below steps -

- Export dynamic plugin assets. This will build and create the static assets for the plugin and put it inside dist-scalprum folder.

`yarn install`

`yarn tsc`

`yarn build`

`yarn export-dynamic`

- Package and copy dist-scalprum folder assets to dynamic-plugins-root folder in [backstage-showcase](https://github.com/janus-idp/backstage-showcase) application.

To Package the plugin, run the below commands.

```
pkg=../plugins/lightspeed
archive=$(npm pack $pkg)
tar -xzf "$archive" && rm "$archive"
mv package $(echo $archive | sed -e 's:\.tgz$::')
```

- Add the extension point inside the `app-config.yaml` or `app-config.local.yaml` file.

```

lightspeed:
  servers:
    - id: <server id>
      url: <serverURL>
      token: <api key> # dummy token

dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-lightspeed:
      appIcons:
        - name: LightspeedIcon
          module: LightspeedPlugin
          importName: LightspeedIcon
      dynamicRoutes:
        - path: /lightspeed
          importName: LightspeedPage
          module: LightspeedPlugin
          menuItem:
            icon: LightspeedIcon
            text: Lightspeed

```
