---
'@red-hat-developer-hub/backstage-plugin-lightspeed': patch
---

Improved normalization of user chat input before send and display. A short intro followed by a numbered list, ASCII bullet lists (hyphen, asterisk, or plus, with optional indentation), or Unicode bullet lines is folded into one Markdown paragraph using hard line breaks and marker escaping where needed. That preserves intended line breaks (soft breaks no longer collapse list lines into one sentence) and keeps list-oriented prompts from splitting awkwardly in the chat UI. Excessive blank lines are tightened, CRLF is normalized, and whitespace-only prompts are not submitted.
