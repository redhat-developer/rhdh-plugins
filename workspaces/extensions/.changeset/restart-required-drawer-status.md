---
'@red-hat-developer-hub/backstage-plugin-extensions': patch
'@red-hat-developer-hub/backstage-plugin-extensions-backend': patch
'@red-hat-developer-hub/backstage-plugin-extensions-common': patch
---

Keep the Extensions side drawer open after enable/disable, show a Restart required status (with tooltip) on the drawer and plugin card until the platform is restarted, and clear that status when the change is reverted.

Also report installation as disabled when the configured dynamic-plugins.yaml file is missing (or otherwise fails to initialize), so Edit/Disable actions are not offered for operations that cannot succeed.
