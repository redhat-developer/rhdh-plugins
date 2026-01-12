# ai-experience

Welcome to the ai-experience plugin!

This plugin enhances the homepage experience for the RHDH AI flavour to provide users with better visibility into the AI-related assets, tools and resources at their disposal.

## Getting started

Your plugin has been added to the example app in this repository, meaning you'll be able to access it by running `yarn start` in the root directory, and then navigating to [/ai-experience](http://localhost:3000/ai-experience).

You can also serve the plugin in isolation by running `yarn start` in the plugin directory.
This method of serving the plugin provides quicker iteration speed and a faster startup and hot reloads.
It is only meant for local development, and the setup for it can be found inside the [/dev](./dev) directory.

## For Administrators

### Prerequisites

Before installing the frontend plugin, ensure that the AI experience backend is integrated into your Backstage instance. Follow the [AI experience backend plugin README](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/ai-integrations/plugins/ai-experience-backend/README.md) for setup instructions.

### Installation

To install the AI experience plugin, run the following command:

```sh
yarn workspace app add @red-hat-developer-hub/backstage-plugin-ai-experience
```

### Configuration

1. Update `/home` Route with the **AI Experience** page in `packages/app/src/App.tsx`:

   ```tsx
   import { AiExperiencePage } from '@red-hat-developer-hub/backstage-plugin-ai-experience';

   <Route path="/home" element={<AiExperiencePage />} />
   ```

2. To add RSS Feeds for the AI News Page,add the following configuration to your `app-config.yaml` file:

   ```yaml
   proxy:
     '/ai-rssfeed':
       target: 'https://www.wired.com/feed/tag/ai/latest/rss'
       changeOrigin: true
       followRedirects: true
   ```

   This configuration allows the plugin to fetch RSS feeds from the specified URL. You can replace the URL with any other RSS feed you want to use.

## For Users

### Using the AI experience Plugin

The AI experience plugin allows users to explore AI-related assets, tools and resources.

#### Prerequisites

- A running Backstage application.
- The AI experience plugin is installed and configured. See [Installation](#installation) for setup instructions.

#### Accessing the Plugin

1. Open your Backstage application.
2. Explore AI-related resources from the home page.
