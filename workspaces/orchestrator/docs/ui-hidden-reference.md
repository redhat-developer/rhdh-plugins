# Dynamic ui:hidden - Quick Reference

## Basic Usage

### Static Hiding

```json
{
  "myField": {
    "type": "string",
    "ui:hidden": true
  }
}
```

## Condition Objects

### Hide when field equals value

```json
{
  "myField": {
    "type": "string",
    "ui:hidden": {
      "when": "deploymentType",
      "is": "simple"
    }
  }
}
```

### Hide when field equals ANY value (OR)

```json
{
  "myField": {
    "type": "string",
    "ui:hidden": {
      "when": "deploymentType",
      "is": ["simple", "managed"]
    }
  }
}
```

### Hide when field does NOT equal value

```json
{
  "myField": {
    "type": "string",
    "ui:hidden": {
      "when": "deploymentType",
      "isNot": "custom"
    }
  }
}
```

### Hide when field is empty

```json
{
  "childField": {
    "type": "string",
    "ui:hidden": {
      "when": "parentField",
      "isEmpty": true
    }
  }
}
```

### Nested field paths

```json
{
  "myField": {
    "type": "string",
    "ui:hidden": {
      "when": "config.server.enabled",
      "is": false
    }
  }
}
```

## Composite Conditions

### AND logic (allOf) - ALL must be true

```json
{
  "myField": {
    "type": "string",
    "ui:hidden": {
      "allOf": [
        { "when": "environment", "is": "production" },
        { "when": "deploymentType", "is": "custom" }
      ]
    }
  }
}
```

### OR logic (anyOf) - ANY can be true

```json
{
  "myField": {
    "type": "string",
    "ui:hidden": {
      "anyOf": [
        { "when": "skipValidation", "is": true },
        { "when": "environment", "is": "development" }
      ]
    }
  }
}
```

### Nested composite

```json
{
  "myField": {
    "type": "string",
    "ui:hidden": {
      "allOf": [
        { "when": "enabled", "is": true },
        {
          "anyOf": [
            { "when": "type", "is": "A" },
            { "when": "type", "is": "B" }
          ]
        }
      ]
    }
  }
}
```

## Common Patterns

### Show only in production

```json
"ui:hidden": {
  "when": "environment",
  "isNot": "production"
}
```

### Hide in production

```json
"ui:hidden": {
  "when": "environment",
  "is": "production"
}
```

### Show when feature enabled

```json
"ui:hidden": {
  "when": "enableFeature",
  "isNot": true
}
```

### Show for specific deployment types

```json
"ui:hidden": {
  "when": "deploymentType",
  "isNot": ["advanced", "custom"]
}
```

### Show when checkbox is checked

```json
"ui:hidden": {
  "when": "useCustomSettings",
  "is": false
}
```

## Supported Operators

| Operator  | Description                           | Example                                 |
| --------- | ------------------------------------- | --------------------------------------- |
| `is`      | Hide if field equals value(s)         | `"is": "value"` or `"is": ["v1", "v2"]` |
| `isNot`   | Hide if field does NOT equal value(s) | `"isNot": "value"`                      |
| `isEmpty` | Hide if field is empty/undefined      | `"isEmpty": true`                       |
| `allOf`   | Hide if ALL conditions true (AND)     | `"allOf": [...]`                        |
| `anyOf`   | Hide if ANY condition true (OR)       | `"anyOf": [...]`                        |

## Important Notes

✅ **DO:**

- Use condition objects for most use cases
- Reference fields by their path (use dot notation for nested fields)
- Test your conditions thoroughly
- Consider performance with many conditional fields

❌ **DON'T:**

- Create circular dependencies (Field A depends on B, B depends on A)
- Forget that hidden fields are still validated and submitted
- Assume hidden fields are secure (they're just hidden, not encrypted)

## Behavior

- ✓ Hidden fields are NOT displayed
- ✓ Hidden fields still participate in validation
- ✓ Hidden fields ARE included in form submission
- ✓ Hidden fields are excluded from review page
- ✓ Visibility updates in real-time when dependencies change
- ✓ Steps with all hidden fields are auto-hidden from stepper

## TypeScript Types

```typescript
import type {
  HiddenCondition,
  HiddenConditionObject,
  HiddenConditionComposite,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-form-react';

// Use in your schema definitions
interface MySchema {
  'ui:hidden'?: HiddenCondition;
}
```

## Full Documentation

See `docs/orchestratorFormWidgets.md` for complete documentation.
