---
'@red-hat-developer-hub/backstage-plugin-extensions': patch
'@red-hat-developer-hub/backstage-plugin-extensions-backend': patch
'@red-hat-developer-hub/backstage-plugin-extensions-common': patch
---

Keep the Extensions side drawer open after enable/disable, show a Restart required status (with tooltip) on the drawer and plugin card until the platform is restarted, and clear that status when the change is reverted.

Track pending restart actions as structured values (enable/disable/install/update) instead of localized strings, and use a consistent package identity so the restart dialog does not list the same package twice. Hydrate the Installed packages table toggle from that pending state, and when a plugin is disabled/enabled from the catalog drawer, mirror the pending action onto its packages so the table stays in sync before restart.

Also report installation as disabled when the configured dynamic-plugins.yaml file is missing (or otherwise fails to initialize), so Edit/Disable actions are not offered for operations that cannot succeed.
