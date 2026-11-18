---
'@red-hat-developer-hub/backstage-plugin-x2a-backend': patch
---

Fix project creation failing when an LLM credential in `x2a.credentials.llm` is not a string.

Values under `x2a.credentials` are read from app-config without schema coercion, so an
unquoted YAML scalar such as `MAX_TOKENS: 32000` reached the Kubernetes API as a number
and made it reject the entire project Secret with `cannot unmarshal number into Go struct
field Secret.stringData of type string`. The user saw only a generic HTTP 400 during
project creation. All `stringData` values are now coerced to strings, and null or
undefined values (from an env var that was never substituted) are dropped.
