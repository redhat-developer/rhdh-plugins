# Test Drawer Plugin

A test drawer plugin for Backstage that demonstrates how to create drawer components with context-based state management.

## Getting Started

This plugin can be accessed by running `yarn start` from this directory, and then navigating to [/test-drawer](http://localhost:3000/test-drawer).

## Components

### TestDrawerProvider

Provider component that wraps your application and provides drawer context and the MUI Drawer component.

```tsx
import { TestDrawerProvider } from '@red-hat-developer-hub/backstage-plugin-test-drawer';

export const App = () => (
  <TestDrawerProvider>
    {/* Your app content */}
  </TestDrawerProvider>
);
```

### TestDrawerContent

The content component that renders inside the MUI Drawer. It includes a header with close button, main content area, and footer.

### TestDrawerButton

A button component that can be placed anywhere to toggle the drawer.

```tsx
import { TestDrawerButton } from '@red-hat-developer-hub/backstage-plugin-test-drawer';

// Use in header or toolbar
<TestDrawerButton />
```

### useTestDrawerContext

Hook to access the drawer context from any component within the provider.

```tsx
import { useTestDrawerContext } from '@red-hat-developer-hub/backstage-plugin-test-drawer';

const MyComponent = () => {
  const { isDrawerOpen, openDrawer, closeDrawer, toggleDrawer, drawerWidth, setDrawerWidth } = useTestDrawerContext();

  return (
    <button onClick={toggleDrawer}>
      {isDrawerOpen ? 'Close' : 'Open'} Drawer
    </button>
  );
};
```

## Context API

The `TestDrawerContextType` provides:

| Property | Type | Description |
|----------|------|-------------|
| `isDrawerOpen` | `boolean` | Whether the drawer is currently open |
| `openDrawer` | `() => void` | Function to open the drawer |
| `closeDrawer` | `() => void` | Function to close the drawer |
| `toggleDrawer` | `() => void` | Function to toggle the drawer state |
| `drawerWidth` | `number` | Current drawer width in pixels |
| `setDrawerWidth` | `Dispatch<SetStateAction<number>>` | Function to set the drawer width |

## CSS Variables

When the drawer is open, the following CSS class and variable are set on `document.body`:

- Class: `test-drawer-open`
- Variable: `--test-drawer-width` (e.g., `400px`)

This allows you to adjust other UI elements when the drawer is open.

