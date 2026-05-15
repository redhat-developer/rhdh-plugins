---
'@red-hat-developer-hub/backstage-plugin-orchestrator': patch
---

Fixed duplicate header and double scrollbars in the NFS app by adding `noHeader: true` to the PageBlueprint so Backstage does not render a second page shell on top of the plugin's own header.
