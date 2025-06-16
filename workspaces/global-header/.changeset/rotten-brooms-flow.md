---
'@red-hat-developer-hub/backstage-plugin-global-header': minor
---

**BREAKING**: Updated the `CompanyLogo` component to support global headers with light or dark background colours.

The `logo` is no longer a string, but an object with `light` and `dark` properties, each containing a string URL for the logo image.

The `CompanyLogo` will prefer the `config.props.logo.[light|dark]` mount point configuration when rendering. If not provided, it will fall back to the `app.branding.fullLogoLight` or `app.branding.fullLogo` app config values, and finally to the Red Hat Developer Hub default logo.
