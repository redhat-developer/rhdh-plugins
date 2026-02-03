---
'@red-hat-developer-hub/backstage-plugin-konflux': patch
'@red-hat-developer-hub/backstage-plugin-konflux-backend': patch
'@red-hat-developer-hub/backstage-plugin-konflux-common': patch
---

Drop @visibility frontend on konflux and clusters containers so backend secrets don’t inherit frontend visibility during schema merge.
