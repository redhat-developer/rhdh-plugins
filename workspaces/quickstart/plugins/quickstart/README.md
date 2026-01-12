# Quickstart Plugin

The Quickstart plugin provides a guided onboarding experience for new users of Red Hat Developer Hub. It displays a customizable drawer interface with interactive quickstart steps that help users get familiar with the platform.

## Features

- **Interactive Drawer Interface**: Displays quickstart steps in a slide-out drawer
- **Progress Tracking**: Tracks completion status of individual steps with persistent storage
- **Configurable Content**: Define custom quickstart items through app configuration
- **Visual Progress Indicator**: Shows overall completion progress with a progress bar
- **Call-to-Action Support**: Each step can include clickable action buttons
- **Role-Based Access Control**: Show different quickstart items based on user roles (admin/developer)

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
      roles: ['admin', 'developer'] # Show to both roles
      cta:
        text: 'Get Started'
        link: '/catalog'
    - title: 'Configure RBAC Policies'
      description: 'Set up role-based access control for your organization'
      icon: 'security'
      roles: ['admin'] # Admin-only quickstart item
      cta:
        text: 'Configure RBAC'
        link: '/rbac'
    - title: 'Create Your First Component'
      description: 'Follow our guide to register your first software component'
      icon: 'code'
      # No roles specified - defaults to 'admin'
      cta:
        text: 'Create Component'
        link: '/catalog-import'
    - title: 'Explore Templates'
      description: 'Discover available software templates to bootstrap new projects'
      icon: 'template'
      roles: ['developer'] # Developer-only quickstart item
      cta:
        text: 'Browse Templates'
        link: '/create'
```

### Configuration Schema

Each quickstart item supports the following properties:

- `title` (required): The display title for the quickstart step
- `description` (required): A brief description of what the step covers
- `icon` (optional): Icon identifier (supports Material UI icons)
- `roles` (optional): Array of user roles that should see this quickstart item. Supported values: `['admin', 'developer']`. If not specified, defaults to `['admin']`
- `cta` (optional): Call-to-action object with:
  - `text`: Button text
  - `link`: Target URL or route

## Role-Based Access Control (RBAC)

The quickstart plugin integrates with Backstage's RBAC system to show different quickstart items based on user roles.

### User Role Determination

The plugin determines user roles using the following logic:

- **When RBAC is disabled** (`permission.enabled: false` or not configured): Users are assumed to be platform engineers setting up RHDH and are assigned the `admin` role
- **When RBAC is enabled** (`permission.enabled: true`): User roles are determined based on permissions:
  - Users with `policy.entity.create` permission are assigned the `admin` role
  - Users without this permission are assigned the `developer` role

### Supported Roles

- **`admin`**: Platform engineers, administrators, and users with elevated permissions
- **`developer`**: Regular developers and users with standard permissions

### Role Assignment Behavior

- Quickstart items without a `roles` property default to `['admin']`
- Items can specify multiple roles: `roles: ['admin', 'developer']`
- Users only see quickstart items that match their assigned role

### Configuration Example

Enable RBAC in your `app-config.yaml`:

```yaml
permission:
  enabled: true

app:
  quickstart:
    - title: 'Platform Configuration'
      roles: ['admin']
      # Only admins see this
    - title: 'Getting Started as Developer'
      roles: ['developer']
      # Only developers see this
    - title: 'Universal Welcome Guide'
      roles: ['admin', 'developer']
      # Both roles see this
```

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
