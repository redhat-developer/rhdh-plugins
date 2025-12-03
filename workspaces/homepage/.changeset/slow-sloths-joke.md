---
'@red-hat-developer-hub/backstage-plugin-dynamic-home-page': patch
---

Fixes an issue with the customizable home page that cards of the same mount point could not be displayed multiple times.

To enable this feature it is still required to change the home page mount point to `DynamicCustomizableHomePage`.

For these customizations the mount points requires also a `config.id` (unique identifier) and `config.title` to be displayed in the "Add widget" dialog. An additional `config.description` can be configured as well.

When customization is disabled mount points with an `config.layout` and these without a `config.id` for backward compatibility will be shown.
