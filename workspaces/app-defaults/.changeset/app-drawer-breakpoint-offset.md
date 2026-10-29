---
'@red-hat-developer-hub/backstage-plugin-app-react': patch
---

Offset MUI breakpoints by the docked app-drawer width so Grid and useMediaQuery use available content width (viewport minus drawer) while keeping the same responsive cascade as before.
