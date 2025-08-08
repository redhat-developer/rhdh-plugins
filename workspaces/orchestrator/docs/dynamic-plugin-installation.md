# Dynamic Plugin Installation (Red Hat Developer Hub)

The Orchestrator plugin can be installed as a dynamic plugin in Red Hat Developer Hub for both production deployments and local development environments.

Pre-built dynamic plugin packages are required for installation. These packages are automatically built and published by the [rhdh-plugin-export-overlays](https://github.com/redhat-developer/rhdh-plugin-export-overlays) CI pipeline and are available in the GitHub Container Registry at `ghcr.io/redhat-developer/rhdh-plugin-export-overlays`.

## Config example

Include the following to the RHDH dynamic plugin configuration, replace `<tag>` with one of the available tags from the available tags (e.g., `bs_1.39.1__5.0.1`).

```yaml
plugins:
  - disabled: false
    package: oci://ghcr.io/redhat-developer/rhdh-plugin-export-overlays/red-hat-developer-hub-backstage-plugin-orchestrator:<tag>!red-hat-developer-hub-backstage-plugin-orchestrator
    pluginConfig:
      dynamicPlugins:
        frontend:
          red-hat-developer-hub.backstage-plugin-orchestrator:
            appIcons:
              - importName: OrchestratorIcon
                name: orchestratorIcon
            dynamicRoutes:
              - importName: OrchestratorPage
                menuItem:
                  icon: orchestratorIcon
                  text: Orchestrator
                path: /orchestrator
            entityTabs:
              - path: /workflows
                title: Workflows
                mountPoint: entity.page.workflows
            mountPoints:
              - mountPoint: entity.page.workflows/cards
                importName: OrchestratorCatalogTab
                config:
                  layout:
                    gridColumn: '1 / -1'
                  if:
                    anyOf:
                      - IsOrchestratorCatalogTabAvailable
  - disabled: false
    package: oci://ghcr.io/redhat-developer/rhdh-plugin-export-overlays/red-hat-developer-hub-backstage-plugin-orchestrator-backend:<tag>!red-hat-developer-hub-backstage-plugin-orchestrator-backend
    pluginConfig:
      orchestrator:
        dataIndexService:
          url: <data index url>
  - disabled: false
    package: oci://ghcr.io/redhat-developer/rhdh-plugin-export-overlays/red-hat-developer-hub-backstage-plugin-orchestrator-form-widgets:<tag>!red-hat-developer-hub-backstage-plugin-orchestrator-form-widgets
    pluginConfig:
      dynamicPlugins:
        frontend:
          red-hat-developer-hub.backstage-plugin-orchestrator-form-widgets: {}
  - disabled: false
    package: oci://ghcr.io/redhat-developer/rhdh-plugin-export-overlays/red-hat-developer-hub-backstage-plugin-scaffolder-backend-module-orchestrator:<tag>!red-hat-developer-hub-backstage-plugin-scaffolder-backend-module-orchestrator
```
