---
'@red-hat-developer-hub/backstage-plugin-orchestrator': major
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets': major
---

**BREAKING**: Graduated the New Frontend System (NFS) orchestrator plugins to stable API.

The NFS plugins (`createFrontendPlugin`) have been promoted from the `./alpha` subpath to the primary `.` entry point. Legacy (OFS) exports have been moved to the new `./legacy` subpath.

For `@red-hat-developer-hub/backstage-plugin-orchestrator`, the `./alpha` subpath now only exports translations. For `@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets`, the `./alpha` subpath has been removed.

**Migration for NFS consumers (previously using `./alpha`):**

```diff
- import orchestratorPlugin, { orchestratorTranslationsModule } from '@red-hat-developer-hub/backstage-plugin-orchestrator/alpha';
- import orchestratorFormWidgetsPlugin from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets/alpha';
+ import orchestratorPlugin, { orchestratorTranslationsModule } from '@red-hat-developer-hub/backstage-plugin-orchestrator';
+ import orchestratorFormWidgetsPlugin from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets';
```

**Migration for OFS consumers:**

```diff
- import { OrchestratorPage, OrchestratorIcon } from '@red-hat-developer-hub/backstage-plugin-orchestrator';
- import { orchestratorFormWidgetsPlugin } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets';
+ import { OrchestratorPage, OrchestratorIcon } from '@red-hat-developer-hub/backstage-plugin-orchestrator/legacy';
+ import { orchestratorFormWidgetsPlugin } from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets/legacy';
```

**Migration for dynamic plugin configurations:**

Legacy exports require `module: Legacy` — they are not available on the default module.
OFS deployments must also load form-widgets via `pluginModule: Legacy` so RHDH registers the OFS `BackstagePlugin` (PluginRoot is now NFS).

```yaml
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-orchestrator:
      # Legacy exports require `module: Legacy`
      dynamicRoutes:
        - path: /orchestrator
          importName: OrchestratorPage
          module: Legacy
    red-hat-developer-hub.backstage-plugin-orchestrator-form-widgets:
      pluginModule: Legacy
```
