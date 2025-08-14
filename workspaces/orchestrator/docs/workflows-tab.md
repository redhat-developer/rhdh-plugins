# ⚙️ Workflows tab for Catalog Entities

## 📌 Overview

The Workflows tab lets useres discover, run, and track workflows associated with a catalog entity. Powered by the Orchestrator plugin, it surfaces relevant workflows for a Component or Resource and shows their recent runs and status.

---

## 🛠️ Enabling the Workflows Tab

### **1️⃣ Add Entity Annotation**

Add the `orchestrator.io/workflows` annotation to enable the **Workflows** tab for an entity:

```yaml
metadata:
  name: example-component
  annotations:
    orchestrator.io/workflows: '[deploy_to_staging,deploy_to_production]'
```

Or, enable the tab without pre-listing workflows by using an empty array:

```yaml
annotations:
  orchestrator.io/workflows: '[]'
```

> When no workflows are listed, the tab will display workflows inferred from historical runs.

---

### **2️⃣ Configure Dynamic Plugins**

The `entityTabs` and `mountPoint` fields are required for this catalog integration.

```yaml
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-orchestrator:
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
```

---

## 🔹 Workflow Execution Flows for Entities

### **🧩 Option 1 – Via Software Templates**

1. Select a template from the **Create** page.
2. Fill in workflow inputs and select a **target entity**.
3. The run is associated with that entity and visible in its tab.

Note: If no entity is selected, the template’s associated entity is used.

---

### **📂 Option 2 – Via Entity “Workflows” Tab**

1. Navigate to an entity’s **Workflows** tab.
2. Select a workflow from the list.
3. Fill in workflow inputs.
4. The entity is linked automatically and the run is visible in its tab.

---

## 🚀 Templates That Create an Entity and Trigger a Workflow

A software template can:

1. Create a new catalog entity (e.g., Component, Resource).
2. Trigger a workflow via Orchestrator backend actions.
3. Automatically link the workflow run to the newly created entity.

This flow runs without showing an **EntityPicker** to the user.  
📄 **Example template:** [greet-with-new-component](https://github.com/redhat-developer/rhdh-plugins/tree/main/workspaces/orchestrator/entities/greet-with-new-component)

---
