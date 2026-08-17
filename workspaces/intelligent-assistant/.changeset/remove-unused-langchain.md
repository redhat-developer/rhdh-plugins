---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': patch
---

Removed unused `@langchain/core` and `@langchain/openai` dependencies left over after the backend switched from an in-process LangChain client to the Lightspeed Core HTTP proxy.
