# Lightspeed plugin for Backstage

Red Hat Developer Lightspeed for Red Hat Developer Hub (Developer Lightspeed for RHDH) is a virtual assistant powered by generative AI that offers in-depth insights into Red Hat Developer Hub (RHDH), including its wide range of capabilities. You can interact with this assistant to explore and learn more about RHDH in greater detail.

Developer Lightspeed for RHDH provides a natural language interface within the RHDH console, helping you easily find information about the product, understand its features, and get answers to your questions as they come up.

## For administrators

### Prerequisites

- Follow the lightspeed backend plugin [README](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/lightspeed/plugins/lightspeed-backend/README.md) to integrate lightspeed backend in your Backstage instance.

**Note**

### Permission Framework Support

The Lightspeed plugin has support for the permission framework.

- When [RBAC permission](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac-backend#installation) framework is enabled, for non-admin users to access lightspeed UI, the role associated with your user should have the following permission policies associated with it. Add the following in your permission policies configuration file named `rbac-policy.csv`:

```CSV
p, role:default/team_a, lightspeed.chat.read, read, allow
p, role:default/team_a, lightspeed.chat.create, create, allow
p, role:default/team_a, lightspeed.chat.delete, delete, allow
p, role:default/team_a, lightspeed.chat.update, update, allow

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
    - package: oci://ghcr.io/redhat-developer/rhdh-plugin-export-overlays/red-hat-developer-hub-backstage-plugin-lightspeed:next__0.6.1!red-hat-developer-hub-backstage-plugin-lightspeed
      disabled: false
      pluginConfig:
        lightspeed:
          # OPTIONAL: Custom users prompts displayed to users
          # If not provided, the plugin uses built-in default prompts
          prompts:
            - title: 'Getting Started with Red Hat Developer Hub'
              message: Can you guide me through the first steps to start using Developer Hub
                as a developer, like exploring the Software Catalog and adding my
                service?
        dynamicPlugins:
          frontend:
            red-hat-developer-hub.backstage-plugin-lightspeed:
              translationResources:
                - importName: lightspeedTranslations
                  module: Alpha
                  ref: lightspeedTranslationRef
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
  prompts: # optional
    - title: <prompt_title>
      message: <prompt_message>
```

---

#### To install this plugin locally in [RHDH](https://github.com/redhat-developer/rhdh) application as a dynamic plugin.

Follow the below steps -

- Export dynamic plugin assets. This will build and create the static assets for the plugin and put it inside dynamic-plugins-root folder.

`yarn install`

`yarn tsc`

`yarn build`

`npx @janus-idp/cli@latest package package-dynamic-plugins --export-to <path-to>/rhdh/dynamic-plugins-root`

- Add the extension point inside the `app-config.yaml` or `app-config.local.yaml` file.

```

dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-lightspeed:
      translationResources:
        - importName: lightspeedTranslations
          module: Alpha
          ref: lightspeedTranslationRef
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
