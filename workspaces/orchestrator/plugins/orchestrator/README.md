# Orchestrator Frontend Plugin for Backstage

Frontend plugin for the Workflow Orchestrator: run and manage workflows.

## Entry points

- **`@red-hat-developer-hub/backstage-plugin-orchestrator`** — New frontend system (NFS): plugin instance, pages, entity content, and translation module.
- **`@red-hat-developer-hub/backstage-plugin-orchestrator/legacy`** — Legacy Backstage app (OFS): `orchestratorPlugin`, `OrchestratorPage`, icons, catalog tab helpers.
- **`@red-hat-developer-hub/backstage-plugin-orchestrator/alpha`** — Translations only (`orchestratorTranslations`, `orchestratorTranslationRef`).

## Development

- **`yarn start`** — Run the NFS dev app (new frontend system).
- **`yarn start:legacy`** — Run the legacy dev app.

For setup, installation, and full documentation, see the workspace [README](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/orchestrator/README.md).
