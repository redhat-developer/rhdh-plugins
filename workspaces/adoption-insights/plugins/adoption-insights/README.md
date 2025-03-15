# Adoption Insights Plugin for Backstage

The Adoption Insights plugin provides an interactive dashboard to visualize analytics data in Backstage. This frontend plugin integrates with the Adoption Insights backend to deliver insights into adoption trends and usage statistics.

## Getting started

Your plugin has been added to the example app in this repository, meaning you'll be able to access it by running `yarn start` in the root directory, and then navigating to [/adoption-insights](http://localhost:3000/adoption-insights).

You can also serve the plugin in isolation by running `yarn start` in the plugin directory.
This method of serving the plugin provides quicker iteration speed and a faster startup and hot reloads.
It is only meant for local development, and the setup for it can be found inside the [/dev](./dev) directory.

## For Administrators

### Prerequisites

Before installing the frontend plugin, ensure that the Adoption Insights backend is integrated into your Backstage instance. Follow the [Adoption Insights backend plugin README](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/adoption-insights/plugins/adoption-insights-backend/README.md) for setup instructions.

### Installation

To install the Adoption Insights plugin, run the following command:

```sh
yarn workspace app add @red-hat-developer-hub/backstage-plugin-adoption-insights
```

### Configuration

1. Add the **Adoption Insights** page to your Backstage application by modifying `packages/app/src/App.tsx`:

   ```tsx
   import { AdoptionInsightsPage } from '@red-hat-developer-hub/backstage-plugin-adoption-insights';

   <Route path="/adoption-insights" element={<AdoptionInsightsPage />} />;
   ```

2. Add a navigation item to the Backstage sidebar by updating `packages/app/src/components/Root/Root.tsx`:

   ```tsx
   import QueryStatsIcon from '@mui/icons-material/QueryStats';

   <SidebarItem
     icon={QueryStatsIcon}
     to="adoption-insights"
     text="Adoption Insights"
   />;
   ```

## For Users

### Using the Adoption Insights Plugin

The Adoption Insights plugin allows users to explore analytics data through an interactive dashboard.

#### Prerequisites

- A running Backstage application.
- The Adoption Insights plugin is installed and configured. See [Installation](#installation) for setup instructions.

#### Accessing the Plugin

1. Open your Backstage application.
2. Navigate to the **Adoption Insights** section from the sidebar.
3. Explore and analyze adoption metrics using the interactive dashboard.
