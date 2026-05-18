---
'@red-hat-developer-hub/backstage-plugin-x2a-backend': patch
'@red-hat-developer-hub/backstage-plugin-x2a-node': patch
---

Refactored callback token handling into a self-validating `CallbackToken` class that encapsulates generation, HMAC signing, and signature verification.
