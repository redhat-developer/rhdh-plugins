---
'@red-hat-developer-hub/backstage-plugin-dynamic-home-page': minor
---

add the ability to let users customize their homepage grid layout using the [Backstage Customizable homepage component](https://github.com/backstage/backstage/blob/master/plugins/home/README.md#customizable-home-page).

This change does not affect the original `HomePage` as it introduces this new capability through new components. So, the user has a choice of choosing its HomePage implementation via the plugin configuration (dynamic routes).
