---
'@red-hat-developer-hub/backstage-plugin-bulk-import': minor
---

Add configurable instructions section for bulk import workflow

This change introduces a fully configurable "Import to Red Hat Developer Hub" instructions section that allows administrators to customize the workflow steps displayed to users.

**New Features:**

- **Configurable Steps**: Define custom workflow steps via `app-config.yaml` with custom text and icons
- **Enhanced Icon Support**: Comprehensive icon system supporting Backstage system icons, Material Design icons, SVG strings, URLs, and legacy built-in icons
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
       icon: 'kind:component' # Backstage system icon
     - id: 'step2'
       text: 'Browse repositories'
       icon: 'search' # Material Design icon
     - id: 'step3'
       text: 'Custom SVG icon'
       icon: '<svg xmlns="http://www.w3.org/2000/svg">...</svg>' # SVG string
     - id: 'step4'
       text: 'External icon'
       icon: 'https://example.com/icon.png' # URL
     - id: 'step5'
       text: 'Legacy built-in icon'
       icon: 'approval-tool' # Legacy format (backward compatible)
     - id: 'step6'
       text: 'No icon step'
       # Steps without icons show text only
```
