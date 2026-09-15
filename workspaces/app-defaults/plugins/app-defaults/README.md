# @red-hat-developer-hub/backstage-plugin-app-defaults

RHDH app module for the **new frontend system**, registered against `pluginId: 'app'`.

The module currently provides:

- Application drawer (`appDrawerExtension`)
- Priority-ordered sidebar (`appSidebarExtension`, extension ID `nav-content:app/sidebar`) that renders `SidebarItemBlueprint` and `SidebarItemGroupBlueprint` contributions from `@red-hat-developer-hub/backstage-plugin-app-react`
- Extensible scaffolder template card (`templateCardExtension`)
- Common RHDH icon catalog via `IconBundleBlueprint` (`icon-bundle:app/common`) — same IDs as the legacy `CommonIcons` map (`home`, `group`, `category`, `extension`, `school`, `add`, `developerHub`, …)
- Learning Paths page at `/learning-paths` (`learningPathsModule`) with proxy-backed data and static JSON fallback

## Customizing Learning Paths

Learning Paths loads card data from the Developer Hub proxy:

`{proxyBaseUrl}{developerHub.proxyPath || '/developer-hub'}/learning-paths`

Configure the proxy in `app-config.yaml`. This is the supported way to deliver customized content in production. See also the [RHDH customizing guide](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.10/html/customizing_red_hat_developer_hub/customize-the-learning-paths-in-rhdh_customizing-rhdh).

#### Hosted JSON file (recommended)

Publish your JSON to a web server (GitHub, GitLab, or internal HTTP), then point the proxy at it:

```yaml
proxy:
  endpoints:
    '/developer-hub':
      target: https://raw.githubusercontent.com/
      pathRewrite:
        '^/api/proxy/developer-hub/learning-paths': '/redhat-developer/rhdh/release-1.10/packages/app/public/learning-paths/data.json'
      changeOrigin: true
      secure: true
```

Replace `target` and the `pathRewrite` value with your hosted JSON location. An example default file is at [redhat-developer/rhdh learning-paths/data.json](https://raw.githubusercontent.com/redhat-developer/rhdh/release-1.10/packages/app/public/learning-paths/data.json).

If you also configure the Home page or Tech Radar through the same `/developer-hub` proxy, add the `learning-paths` `pathRewrite` **before** broader rules such as `'^/api/proxy/developer-hub'`.

#### Customization service

For a dedicated backend that serves Learning Paths JSON:

```yaml
proxy:
  endpoints:
    '/developer-hub/learning-paths':
      target: ${LEARNING_PATH_DATA_URL}
      changeOrigin: true
      secure: true
```

Set `LEARNING_PATH_DATA_URL` to your service endpoint (for example `http://rhdh-customization-provider/learning-paths`).

#### Optional proxy mount override

If your proxy endpoint uses a path other than `/developer-hub`:

```yaml
developerHub:
  proxyPath: /custom-hub
```

The frontend then requests `{proxyBaseUrl}/custom-hub/learning-paths`.

#### Fallback when the proxy is unavailable

When the proxy request fails, the page uses bundled demo data from `src/learning-paths/data/data.json` (included in the plugin bundle at build time).

## Usage

- **Dynamic loading**: default export is a `FrontendModule` suitable for `@backstage/frontend-dynamic-feature-loader`.
- **Static**: import `appDefaultsModule` from `@red-hat-developer-hub/backstage-plugin-app-defaults`.
