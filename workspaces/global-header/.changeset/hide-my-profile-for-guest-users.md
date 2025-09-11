---
'@red-hat-developer-hub/backstage-plugin-global-header': patch
---

Add `type` prop for MenuItemLink identification and hide "My profile" menuItemLink for guest users

- Add `type` prop to MenuItemLink component config for better identification when i18n applied
- Hide "My Profile" menu item when user entity reference contains '/guest'
- Hide "My Profile" menu item when catalog API fails to fetch user entity
- Export `globalHeaderTranslations` from plugin for i18n integration
