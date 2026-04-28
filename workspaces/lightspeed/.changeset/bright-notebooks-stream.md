---
'@red-hat-developer-hub/backstage-plugin-lightspeed': minor
'@red-hat-developer-hub/backstage-plugin-lightspeed-backend': patch
---

Add notebook chat with streaming support, document management, and UI improvements.

- Backend: add SSE transform to normalize Responses API format to legacy streaming format so notebook chat streams token-by-token like the chat tab.
- Frontend: add notebook chat view with conversation messages, document sidebar with per-document delete, and topic summary display.
- Fix stale document list when re-opening a notebook by setting query staleTime to 0.
- Hide model selector on the Notebooks tab while keeping the settings ellipsis menu visible.
