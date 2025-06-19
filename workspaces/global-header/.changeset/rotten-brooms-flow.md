---
'@red-hat-developer-hub/backstage-plugin-global-header': minor
---

**BREAKING**: Updated the `CompanyLogo` component to support global headers with light or dark background colours.

The `logo` is no longer a string, but an object with `light` and `dark` properties, each containing a string URL for the logo image.

The `CompanyLogo` will prefer the `config.props.logo.[light|dark]` mount point configuration when rendering. If not provided, it will fall back to the `app.branding.fullLogo` in the app configuration.

`app.branding.fullLogo` is now an object with `light` and `dark` properties, each containing a string URL for the logo image. For backwards compatibility, if `app.branding.fullLogo` is a string, it will be used for both light and dark modes.

If neither `config.props.logo` nor `app.branding.fullLogo` is provided, the `CompanyLogo` will render the Red Hat Developer Hub logo by default.
