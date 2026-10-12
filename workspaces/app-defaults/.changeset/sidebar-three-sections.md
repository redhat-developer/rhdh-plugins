---
'@red-hat-developer-hub/backstage-plugin-app-defaults': minor
---

Split the NFS sidebar into default, optional-plugin, and admin/settings sections with conditional dividers. Hide Settings and the company logo by default when the global header is present (`app.sidebar.settings` / `app.sidebar.logo` override), and hide Administration when the user lacks admin permission or the group has no visible children. Offset the fixed sidebar root below the masthead (`height: 100vh − header`) with the drawer filling the root, and use a stable scrollbar gutter in the menu scroller so items do not shift when the scrollbar appears.
