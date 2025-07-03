# Quickstart Plugin

The Quickstart plugin provides a guided onboarding experience for new users of Red Hat Developer Hub. It displays a customizable drawer interface with interactive quickstart steps that help users get familiar with the platform.

## Features

- **Interactive Drawer Interface**: Displays quickstart steps in a slide-out drawer
- **Progress Tracking**: Tracks completion status of individual steps with persistent storage
- **Configurable Content**: Define custom quickstart items through app configuration
- **Visual Progress Indicator**: Shows overall completion progress with a progress bar
- **Call-to-Action Support**: Each step can include clickable action buttons

## Installation

1. Install the plugin package:

```bash
# From the root of your app
yarn add --cwd packages/app @red-hat-developer-hub/backstage-plugin-quickstart
```

2. Add the plugin to your Backstage app by modifying `packages/app/src/App.tsx`:

```tsx
import { QuickstartDrawerProvider } from '@red-hat-developer-hub/backstage-plugin-quickstart';

// Wrap your app with the QuickstartDrawerProvider
const App = () => (
  <AppProvider>
    <QuickstartDrawerProvider>
      {/* Your existing app components */}
    </QuickstartDrawerProvider>
  </AppProvider>
);
```

## Configuration

Configure quickstart items in your `app-config.yaml`:

```yaml
app:
  quickstart:
    - title: 'Welcome to Developer Hub'
      description: 'Learn the basics of navigating the Developer Hub interface'
      icon: 'home'
      cta:
        text: 'Get Started'
        link: '/catalog'
    - title: 'Create Your First Component'
      description: 'Follow our guide to register your first software component'
      icon: 'code'
      cta:
        text: 'Create Component'
        link: '/catalog-import'
    - title: 'Explore Templates'
      description: 'Discover available software templates to bootstrap new projects'
      icon: 'template'
      cta:
        text: 'Browse Templates'
        link: '/create'
```

### Configuration Schema

Each quickstart item supports the following properties:

- `title` (required): The display title for the quickstart step
- `description` (required): A brief description of what the step covers
- `icon` (optional): Icon identifier (supports Material UI icons)
- `cta` (optional): Call-to-action object with:
  - `text`: Button text
  - `link`: Target URL or route

## Usage

### Using the Context Hook

Access quickstart drawer functionality in your components:

```tsx
import { useQuickstartDrawerContext } from '@red-hat-developer-hub/backstage-plugin-quickstart';

const MyComponent = () => {
  const { openDrawer, closeDrawer, isDrawerOpen } =
    useQuickstartDrawerContext();

  return <button onClick={openDrawer}>Open Quickstart Guide</button>;
};
```

### Progress Persistence

The plugin automatically saves progress to local storage, so users can continue where they left off even after refreshing the page or returning later.

## Development

### Local Development

To run the plugin in isolation for development:

```bash
cd plugins/quickstart
yarn start
```

This will start the plugin with hot reloading for faster development iteration.

### Testing

Run the test suite:

```bash
yarn test
```

### Building

Build the plugin for production:

```bash
yarn build
```
