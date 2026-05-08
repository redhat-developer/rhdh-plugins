---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets': patch
---

Evaluate `$${{…}}` placeholders in `fetch:response:value`, `fetch:response:autocomplete`, `fetch:response:label`, and `fetch:response:value` (dropdown) before applying JSONata to the fetch response, consistent with other fetch template fields. Align `ActiveDropdown` and `ActiveTextInput` autocomplete with `ActiveMultiSelect` by treating undefined selector results as empty string arrays when building options, so invalid paths while editing do not surface as hard errors.
