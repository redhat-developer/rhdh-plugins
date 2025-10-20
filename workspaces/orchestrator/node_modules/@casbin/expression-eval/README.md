# expression-eval

[![NPM version][npm-image]][npm-url]
[![NPM download][download-image]][download-url]
[![ci](https://github.com/node-casbin/expression-eval/actions/workflows/ci.yml/badge.svg)](https://github.com/node-casbin/expression-eval/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/node-casbin/expression-eval/badge.svg?branch=master)](https://coveralls.io/github/node-casbin/expression-eval?branch=master)
[![Discord](https://img.shields.io/discord/1022748306096537660?logo=discord&label=discord&color=5865F2)](https://discord.gg/S5UjpzGZjN)

[npm-image]: https://img.shields.io/npm/v/@casbin/expression-eval.svg?style=flat-square
[npm-url]: https://npmjs.org/package/@casbin/expression-eval
[download-image]: https://img.shields.io/npm/dm/@casbin/expression-eval.svg?style=flat-square
[download-url]: https://npmjs.org/package/@casbin/expression-eval

JavaScript expression parsing and evaluation.

Powered by [jsep](https://github.com/soney/jsep).

## Installation

Install:

```
npm install --save @casbin/expression-eval
```

Import:

```js
// ES6
import { parse, eval } from '@casbin/expression-eval';
// CommonJS
const { parse, eval } = require('@casbin/expression-eval');
// UMD / standalone script
const { parse, eval } = window['@casbin/expression-eval'];
```

## API

### Parsing

```javascript
import { parse } from '@casbin/expression-eval';
const ast = parse('1 + foo');
```

The result of the parse is an AST (abstract syntax tree), like:

```json
{
  "type": "BinaryExpression",
  "operator": "+",
  "left": {
    "type": "Literal",
    "value": 1,
    "raw": "1"
  },
  "right": {
    "type": "Identifier",
    "name": "foo"
  }
}
```

### Evaluation

```javascript
import { parse, eval } from '@casbin/expression-eval';
const ast = parse('a + b / c'); // abstract syntax tree (AST)
const value = eval(ast, {a: 2, b: 2, c: 5}); // 2.4
```

Alternatively, use `evalAsync` for asynchronous evaluation.

### Compilation

```javascript
import { compile } from '@casbin/expression-eval';
const fn = compile('foo.bar + 10');
fn({foo: {bar: 'baz'}}); // 'baz10'
```

Alternatively, use `compileAsync` for asynchronous compilation.

## Security

Although this package does [avoid the use of `eval()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#Do_not_ever_use_eval!), it _cannot guarantee that user-provided expressions, or user-provided inputs to evaluation, will not modify the state or behavior of your application_. This library does not attempt to provide a secure sandbox for evaluation. Evaluation of arbitrary user inputs (expressions or values) may lead to unsafe behavior. If your project requires a secure sandbox, consider alternatives such as [vm2](https://www.npmjs.com/package/vm2).

## License

Apache 2.0 License.
