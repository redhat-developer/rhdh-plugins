---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': patch
---

Fix Intelligent Assistant fullscreen page to fill the RHDH content well with matching shell corners, and keep the message composer and AI disclaimer footnote visible without scrolling (fill the theme SidebarPage height instead of a broken local 100vh calc; pin the chat footer and stop the history drawer from scrolling content+footer together). Also keep a solid circular FAB and avoid a short loading flash when switching from overlay/docked mode.
