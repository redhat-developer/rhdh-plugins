# @red-hat-developer-hub/backstage-plugin-boost

Frontend plugin for the Boost AI platform in Red Hat Developer Hub. Provides the AI Catalog browse page and entity page extensions for AI assets.

## Features

- **AI Catalog browse page** at `/ai-catalog` — card grid for discovering AI skills, rules, MCP servers, agents, and models
- **Entity page extensions** — summary card, download/adopt card, version list card, and usage tab on AI asset entity pages
- **`isAiAsset` filter** — condition filter for NFS Blueprints that matches all AI asset entity kind/type combinations

## Public API

| Export                    | Type                  | Description                                         |
| ------------------------- | --------------------- | --------------------------------------------------- |
| `default` (boostPlugin)   | `FrontendPlugin`      | The NFS plugin with all pages and entity extensions |
| `boostTranslationsModule` | `FrontendModule`      | Translation module (install separately in app)      |
| `boostTranslationRef`     | `TranslationRef`      | Translation reference for i18n                      |
| `boostTranslations`       | `TranslationResource` | Translation resource with locale support            |

## Getting started

Start the dev app from the workspace root:

```bash
cd workspaces/boost
yarn install
yarn start
```

Navigate to [/ai-catalog](http://localhost:3000/ai-catalog) to see the AI Catalog page.
