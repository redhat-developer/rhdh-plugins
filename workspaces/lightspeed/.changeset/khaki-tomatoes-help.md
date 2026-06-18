---
'@red-hat-developer-hub/backstage-plugin-lightspeed': patch
---

Backport: Fix document upload gating and conversation deletion in notebooks

This backports fixes from commits f7d96f8, e49fc2c, and d5199d6 on main to the 1.10 release line:

- Prevent additional document uploads while another document is still being processed, avoiding race conditions in the notebook vector store
- Fix document deletion to use the proper conversations API abstraction instead of direct internal base URL access
