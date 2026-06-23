# Lightspeed plugin for Backstage

Red Hat Developer Hub Intelligent Assistant (Intelligent Assistant for RHDH) is a virtual assistant powered by generative AI that offers in-depth insights into Red Hat Developer Hub (RHDH), including its wide range of capabilities. You can interact with this assistant to explore and learn more about RHDH in greater detail.

The Intelligent Assistant for RHDH provides a natural language interface within the RHDH console, helping you easily find information about the product, understand its features, and get answers to your questions as they come up.

## Plugin Architecture

This plugin supports two frontend systems:

| Entry Point    | System                        | Import Path                                                 |
| -------------- | ----------------------------- | ----------------------------------------------------------- |
| `./` (default) | **NFS** (New Frontend System) | `@red-hat-developer-hub/backstage-plugin-lightspeed`        |
| `./legacy`     | **OFS** (Old Frontend System) | `@red-hat-developer-hub/backstage-plugin-lightspeed/legacy` |
| `./alpha`      | Translations only             | `@red-hat-developer-hub/backstage-plugin-lightspeed/alpha`  |

NFS is the primary and recommended mode. OFS is preserved for community consumers until Backstage 2.x drops OFS support.

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

# Required for Notebooks feature (if enabled)
p, role:default/team_a, lightspeed.notebooks.use, update, allow

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

```console
yarn workspace app add @red-hat-developer-hub/backstage-plugin-lightspeed
```

### Configuration

#### NFS (New Frontend System) — Recommended

NFS is the default export. Import modules directly from the package root and register them as features in `createApp`:

```tsx
import { createApp } from '@backstage/frontend-defaults';

import { appDrawerModule } from '@red-hat-developer-hub/backstage-plugin-app-react/alpha';
import {
  lightspeedFABModule,
  lightspeedRedirectModule,
  lightspeedTranslationsModule,
} from '@red-hat-developer-hub/backstage-plugin-lightspeed';

export default createApp({
  features: [
    appDrawerModule,
    lightspeedFABModule,
    lightspeedRedirectModule,
    lightspeedTranslationsModule,
    // ...other modules
  ],
});
```

Enable the extensions in `app-config.yaml`:

```yaml
app:
  extensions:
    - app-root-wrapper:app/drawer
    - app-root-wrapper:app/lightspeed-fab
    - translation:app/lightspeed-translations
    - api:app/app-language:
        config:
          availableLanguages: ['en', 'de', 'es', 'fr', 'it', 'ja']
          defaultLanguage: 'en'
```

> **Important:** The order of `app-root-wrapper` extensions matters. `app/drawer` must come before `app/lightspeed-fab` to ensure correct React Context nesting.

#### OFS (Old Frontend System / Legacy)

Legacy components are available at the `./legacy` subpath:

```tsx
import {
  LightspeedDrawerProvider,
  LightspeedIcon,
  LightspeedPage,
} from '@red-hat-developer-hub/backstage-plugin-lightspeed/legacy';
```

Add a route in `packages/app/src/App.tsx`:

```tsx
<Route path="/intelligent-assistant" element={<LightspeedPage />} />
```

Add a sidebar entry in `packages/app/src/components/Root/Root.tsx`:

```tsx
<SidebarItem
  icon={LightspeedIcon as IconComponent}
  to="intelligent-assistant"
  text="Intelligent assistant"
/>
```

## For users

### Using the Lightspeed plugin in Backstage

Lightspeed is a front-end plugin that enables you to interact with any LLM server running a model with OpenAI's API compatibility.

#### Prerequisites

- Your Backstage application is installed and running.
- You have installed the Lightspeed plugin. For installation process, see [Installation](#installation).

#### Procedure

1. Open your Backstage application and select the **Intelligent assistant** nav item from the **Navigation**.
2. Ask your questions to the intelligent assistant chatbot.

### Display modes and chat continuity

Intelligent assistant supports multiple **display modes** from Settings (for example overlay, docked, embedded, and fullscreen). Switching modes can remount the chat surface; your **current conversation** and **tool-call metadata** for that thread stay with the session so the active chat is not reset. Live streaming text may not update continuously across a mode switch until the assistant response finishes loading.

### MCP servers settings

Intelligent assistant includes an MCP servers settings panel where users can:

- View configured MCP servers and current status
- Enable or disable eligible servers
- Configure a personal token per server
- See inline status and validation feedback

#### Token validation behavior

When configuring a server token in the settings modal, the token is validated
automatically after typing stops briefly. The input shows inline feedback:

- Success: `Connection successful`
- Error: `Authorization failed. Try again.`

Users can then save the configuration after validation feedback is displayed.

### Notebooks (Developer Preview)

Notebooks is an experimental feature that enables **document-based conversations with Retrieval-Augmented Generation (RAG)**. This feature allows you to:

- **Create persistent notebook sessions** with their own vector databases
- **Upload and manage documents** to query against, including:
  - Text files (`.txt`, `.md`, `.log`)
  - PDF documents with automatic text extraction
  - Structured data (`.json`, `.yaml`)
  - Web content via URL (up to 20MB per file)
- **Query your documents** using natural language and get context-aware AI responses
- **Organize documents** by sessions with metadata and tagging
- **Maintain context** across conversations - all uploaded documents remain available throughout the session

#### How Notebooks Works

1. **Session Management**: Create a notebook session, which is backed by its own vector database
2. **Document Upload**: Upload documents - they are automatically processed, chunked, and embedded into the vector database
3. **RAG Conversations**: Ask questions about your documents - relevant chunks are retrieved and provided as context to the LLM
4. **Persistent Storage**: Your documents and conversations remain available throughout the session lifecycle

#### Prerequisites for Notebooks

- Notebooks requires a **Lightspeed Stack service** to be running
- The backend administrator must enable the feature (see [Backend Configuration](../lightspeed-backend/README.md#notebooks-developer-preview))
- Users need the appropriate RBAC permissions (if enabled)

#### Using Notebooks

1. Ensure Notebooks is enabled in your Backstage instance
2. Navigate to the Intelligent assistant page
3. Create a new notebook session or select an existing one
4. Upload documents you want to query
5. Start asking questions about your uploaded documents

For backend configuration and API details, administrators should refer to the [Lightspeed Backend Plugin Documentation](../lightspeed-backend/README.md#notebooks-developer-preview).

## Loading as Dynamic Plugin

### NFS Mode (Module Federation)

NFS mode uses standard Module Federation for dynamic plugin loading. Set the following environment variables on the RHDH instance:

```env
APP_CONFIG_app_packageName=app-next
ENABLE_STANDARD_MODULE_FEDERATION=true
```

Enable the plugin and its extensions in your dynamic plugins configuration:

```yaml
plugins:
  - package: './local-plugins/red-hat-developer-hub-backstage-plugin-lightspeed'
    disabled: false
```

Then configure extensions in `app-config.yaml`:

```yaml
app:
  extensions:
    - app-root-wrapper:app/drawer
    - app-root-wrapper:app/lightspeed-fab
    - translation:app/lightspeed-translations
    - api:app/app-language:
        config:
          availableLanguages: ['en', 'de', 'es', 'fr', 'it', 'ja']
          defaultLanguage: 'en'
```

**Verify** the modules are exposed by checking:

```
http://localhost:7007/.backstage/dynamic-features/remotes
```

Expected: entries for `LightspeedFABModule` and `LightspeedTranslationsModule`.

---

### OFS Mode (Scalprum / Legacy)

OFS mode uses Scalprum for dynamic plugin loading. The plugin configuration **must** include `module: Legacy` on all OFS mount points and routes, and `module: Alpha` on translation resources:

```yaml
plugins:
  - package: './local-plugins/red-hat-developer-hub-backstage-plugin-lightspeed'
    disabled: false
    pluginConfig:
      dynamicPlugins:
        frontend:
          red-hat-developer-hub.backstage-plugin-lightspeed:
            translationResources:
              - importName: lightspeedTranslations
                module: Alpha
                ref: lightspeedTranslationRef
            dynamicRoutes:
              - path: /intelligent-assistant
                importName: LightspeedPage
                module: Legacy
            mountPoints:
              - mountPoint: application/listener
                importName: LightspeedFAB
                module: Legacy
              - mountPoint: application/provider
                importName: LightspeedDrawerProvider
                module: Legacy
              - mountPoint: application/internal/drawer-state
                importName: LightspeedDrawerStateExposer
                module: Legacy
              - mountPoint: application/internal/drawer-content
                importName: LightspeedChatContainer
                module: Legacy
                config:
                  id: lightspeed
                  priority: 100
```

**Verify** the plugin is loaded via:

```
http://localhost:7007/api/scalprum/plugins
```

---

### Installing locally

Export the dynamic plugin assets and install into your RHDH instance:

```bash
cd workspaces/lightspeed/plugins/lightspeed
yarn install
yarn tsc
yarn build
npx @red-hat-developer-hub/cli plugin export --dev --dynamic-plugins-root <path-to-dynamic-plugins-root>
```

Then configure the plugin for either NFS or OFS mode as described above.

---

## Migration Guide

### NFS consumers

```ts
// Before (alpha subpath)
import { lightspeedFABModule } from '@red-hat-developer-hub/backstage-plugin-lightspeed/alpha';

// After (default entry point)
import { lightspeedFABModule } from '@red-hat-developer-hub/backstage-plugin-lightspeed';
```

### Legacy / OFS consumers

```ts
// Before (default entry point)
import { LightspeedPage, LightspeedDrawerProvider } from '@red-hat-developer-hub/backstage-plugin-lightspeed';

// After (legacy subpath)
import { LightspeedPage, LightspeedDrawerProvider } from '@red-hat-developer-hub/backstage-plugin-lightspeed/legacy';
```

### Dynamic plugin configuration (OFS)

All mount points and dynamic routes now require `module: Legacy`. Without it, the scalprum loader cannot distinguish legacy components from NFS extensions:

```yaml
# Before (no module specified — resolved from default PluginRoot)
dynamicRoutes:
  - path: /intelligent-assistant
    importName: LightspeedPage

# After (explicit module targeting)
dynamicRoutes:
  - path: /intelligent-assistant
    importName: LightspeedPage
    module: Legacy
```

### Dynamic plugin module name change

The `LightspeedPlugin` scalprum module has been removed. Configurations that previously used `module: LightspeedPlugin` should be updated:

- **OFS/Legacy** — use `module: Legacy`
- **NFS** — use the default `module: PluginRoot` (or omit `module` entirely)

```yaml
# Before
dynamicRoutes:
  - path: /intelligent-assistant
    importName: LightspeedPage
    module: LightspeedPlugin

# After (OFS)
dynamicRoutes:
  - path: /intelligent-assistant
    importName: LightspeedPage
    module: Legacy
```
