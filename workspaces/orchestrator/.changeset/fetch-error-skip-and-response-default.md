---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': minor
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets': minor
---

Add fetch:error:skip and fetch:response:default options for form widgets

**Feature 1: fetch:error:skip**

When using widgets with `fetch:retrigger` dependencies, the initial fetch often fails because dependent fields don't have values yet. This results in HTTP errors being displayed during initial load.

- Add `fetch:error:skip` option to suppress fetch error display until all `fetch:retrigger` dependencies have non-empty values
- Errors are only suppressed when dependencies are empty; once filled, real errors are shown
- Supported by: ActiveTextInput, ActiveDropdown, ActiveMultiSelect, SchemaUpdater

**Feature 2: fetch:response:default**

Widgets previously required `fetch:response:value` for defaults, meaning fetch must succeed. This adds static fallback defaults.

- Add `fetch:response:default` option for static default values applied immediately on form initialization
- Defaults are applied at form initialization level in `OrchestratorForm`, ensuring controlled components work correctly
- Static defaults act as fallback when fetch fails, hasn't completed, or returns empty
- Fetched values only override defaults when non-empty
- Supported by: ActiveTextInput (string), ActiveDropdown (string), ActiveMultiSelect (string[])

**Usage Examples:**

```json
{
  "action": {
    "ui:widget": "ActiveTextInput",
    "ui:props": {
      "fetch:url": "...",
      "fetch:retrigger": ["current.appName"],
      "fetch:error:skip": true,
      "fetch:response:default": "create"
    }
  }
}
```
