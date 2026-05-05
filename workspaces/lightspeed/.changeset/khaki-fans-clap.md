---
'@red-hat-developer-hub/backstage-plugin-lightspeed': patch
---

### Lightspeed shell and Notebooks

- **Fullscreen**: Chat and Notebooks stay on separate tabs. While the Notebooks tab is active, chat-only header actions (for example chat history, pinned chats, and MCP settings) are hidden so the header matches the active surface.
- **Overlay and docked**: Only the **Chat** surface is shown; the Chat/Notebooks tab strip is not shown, because Notebooks is intended for the fullscreen experience only.
- **Leaving fullscreen from Notebooks**: If you switch from fullscreen while on Notebooks to overlay or docked, you land on **Chat** in the shell, and the next time you open fullscreen you start on **Chat** again (no lingering Notebooks selection).
