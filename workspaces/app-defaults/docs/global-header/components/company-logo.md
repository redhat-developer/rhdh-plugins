# Company logo

The global header ships with a company logo (`gh-component:global-header/company-logo`)
by default. The building-block export is named **`GlobalHeaderCompanyLogo`**
(from `@red-hat-developer-hub/backstage-plugin-app-defaults/global-header-components`)
so it does not collide with the sidebar `CompanyLogo` on the package root.

## Key features

- Company logo is part of the global header **by default**.
- Support for **theme-specific logos** (separate logos for light and dark themes).
- Support for a **single logo** used across all themes.
- **Customizable logo dimensions** via width and height props.
- **Clickable logo**: custom navigation path can be configured.
- **Backward compatibility** with older `app.branding.fullLogo` configurations.

## Deployer configuration (`app.branding`)

The default header logo reads theme-specific (or single) logos from
`app.branding` when no props are passed. This is the usual way to brand the
masthead without writing plugin code:

```yaml
app:
  branding:
    fullLogoWidth: 220 # fallback width
    # fullLogo: "data:image/svg+xml;base64,PHN2ZyB4bWxu…" # Single image for all themes
    fullLogo:
      light: 'data:image/svg+xml;base64,PHN2ZyB4bWxu…' # shown in light theme
      dark: 'data:image/svg+xml;base64,PHN2ZyB4bWxu…' # shown in dark theme
```

The masthead shows the company logo by default. When the global header is
mounted, the theme typically hides the sidebar company logo so branding is not
duplicated.

Disable or reorder the default logo extension via NFS config:

```yaml
app:
  extensions:
    - gh-component:global-header/company-logo:
        disabled: true
    # or:
    - gh-component:global-header/company-logo:
        config:
          priority: 200
```

## Custom logo via New Frontend System

To change navigation target, dimensions, or logo URLs in code, replace (or
contribute) a toolbar component that renders `GlobalHeaderCompanyLogo`:

```typescript
import { GlobalHeaderComponentBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react';

export const customCompanyLogo = GlobalHeaderComponentBlueprint.make({
  name: 'company-logo',
  params: {
    priority: 200,
    loader: async () => {
      const { GlobalHeaderCompanyLogo } = await import(
        '@red-hat-developer-hub/backstage-plugin-app-defaults/global-header-components'
      );
      return () => (
        <GlobalHeaderCompanyLogo
          to="/catalog"
          width={300}
          height={40}
          // logo: 'data:image/png;base64,…' // single logo for all themes
          logo={{
            dark: 'data:image/png;base64,…',
            light: 'data:image/png;base64,…',
          }}
        />
      );
    },
  },
});
```

Prefer a blueprint `loader` so the logo UI stays off the root NFS sync chunk.
See the [New Frontend System Guide](../new-frontend-system.md) for registration
details.

> Do **not** confuse `GlobalHeaderCompanyLogo` (`logo` prop) with the package-root
> sidebar `CompanyLogo` (`fullLogo` / `iconLogo`). Both can read
> `app.branding.fullLogo`, but the prop APIs differ on purpose.

## Fallback behavior

### Logo source priority

1. `GlobalHeaderCompanyLogo` props (`logo` / `logo.light` / `logo.dark`)
2. `app.branding.fullLogo`
3. Default RHDH theme-specific logo

### Logo sizing

#### Width priority

1. `props.width`
2. `app.branding.fullLogoWidth` (from `app-config.yaml`)
3. Default: `150px`

#### Height priority

Increasing the `height` also increases the overall height of the global header.

1. `props.height`
2. Default maximum height: `40px` (applied automatically if not specified)

#### Rendering behavior

- The logo uses `object-fit: contain` to maintain the original aspect ratio.
- The image is never cropped or distorted.
- If the configured `width` would result in a height greater than the allowed
  maximum (default: 40px), it is **automatically scaled down**.
- In some cases, changing only the width may **not visibly affect** the logo
  unless height is also adjusted.
