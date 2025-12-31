---
'@red-hat-developer-hub/backstage-plugin-bulk-import': minor
---

Add configurable instructions section for bulk import workflow

This change introduces a fully configurable "Import to Red Hat Developer Hub" instructions section that allows administrators to customize the workflow steps displayed to users.

**New Features:**

- **Configurable Steps**: Define custom workflow steps via `app-config.yaml` with custom text and icons
- **Icon Support**: Support for both built-in theme-aware icons and custom URL-based icons
- **Dynamic Layout**: Steps automatically adjust width for optimal space usage (≤6 steps fill width, >6 steps scroll horizontally)
- **User Preferences**: Collapsed/expanded state persisted in localStorage per user
- **Universal Display**: Instructions section now shows for both PR flow and scaffolder flow
- **Smart Hiding**: Section automatically hides when no steps are configured

**Configuration Schema:**

```yaml
bulkImport:
  # Enable/disable the instructions section (default: true)
  instructionsEnabled: true

  # Default expanded state (default: true)
  instructionsDefaultExpanded: true

  # Custom workflow steps
  instructionsSteps:
    - id: 'step1'
      text: 'Choose your source control platform'
      icon:
        type: 'builtin' # or "url"
        source: 'approval-tool' # icon name or URL
    - id: 'step2'
      text: 'Configure without icon'
      # Steps without icons show text only
```
