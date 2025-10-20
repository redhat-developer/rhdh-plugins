Escape Markdown control characters.

```javascript
var escape = require('markdown-escape')
var assert = require('assert')

assert(escape("#1! We're #1!") === "\\#1! We're \\#1!")
assert(escape("http://example.com") === 'http:\\/\\/example.com')
assert(escape('one (1)') === 'one \\(1\\)')

// Skip escaping specific characters.
assert(escape('one (1)', ['parentheses']) === 'one (1)')
assert(escape("http://example.com", ['slashes']) === 'http://example.com')
```
