---
'@red-hat-developer-hub/backstage-plugin-global-header': minor
---

Updated the `CompanyLogo` component to support global headers either light or dark background colours. The light/dark mode of the logo is determined by the `theme.palette.rhdh.general.appBarBackgroundScheme` field in the theme configuration.

The `logo` prop now also accepts an object with `light` and `dark` properties, each containing a string URL for the logo image. If `logo` is a string, it will be used for both light and dark modes.

The `CompanyLogo` will prefer the `config.props.logo.[light|dark]` mount point configuration when rendering. If not provided, it will fall back to the `app.branding.fullLogo` in the app configuration.

Moreover, `app.branding.fullLogo` is now an object with `light` and `dark` properties, each containing a string URL for the logo image. If `app.branding.fullLogo` is a string, it will be used for both light and dark modes.

If neither `config.props.logo` nor `app.branding.fullLogo` is provided, the `CompanyLogo` will render the Red Hat Developer Hub logo by default.
