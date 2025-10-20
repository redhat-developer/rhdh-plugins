# bath (ES5, transpiled for the browser)

A simple path template engine. Forked from [bouzuya/bath](https://github.com/bouzuya/bath)

Twitter hashtag is [#bathjs](https://twitter.com/hashtag/bathjs).

This branch is for 2.x users. 1.x users: See [1.x](/../../tree/1.x) branch.

## Installation

```bash
$ npm install bath-es5
```

## Usage

```ts
import assert from 'assert';
import bath from 'bath';

const { names, params, path } = bath('/users/{id}');
assert.deepEqual(names, ['id']);
assert.deepEqual(params('/users/123'), { id: '123' });
assert.deepEqual(path({ id: '123' }), '/users/123');
```

```ts
import assert from 'assert';
import { names, params, path } from 'bath';

const template = '/users/{id}';
assert.deepEqual(names(template), ['id']);
assert.deepEqual(params(template)('/users/123'), { id: '123' });
assert.deepEqual(path(template)({ id: '123' }), '/users/123');
```

```ts
import assert from 'assert';
import { names } from 'bath/names'; // import `names()` only
import { params } from 'bath/params'; // import `params()` only
import { path } from 'bath/path';     // import `path()` only

const template = '/users/{id}';
assert.deepEqual(names(template), ['id']);
assert.deepEqual(params(template)('/users/123'), { id: '123' });
assert.deepEqual(path(template)({ id: '123' }), '/users/123');
```

## Types

```ts
// '/users/{userId}/messages/{messageId}'
export type PathTemplate = string;

// 'userId'
export type ParameterName = string;

// { 'userId': /^\w+$/, 'messageId': /^\d+$/ }
export type ParameterPatterns = { [parameterName: string]: RegExp; };

// { 'userId': 'john', 'messageId': '123' }
export type Parameters = { [parameterName: string]: string; };

// '/users/john/messages/123'
export type Path = string;

// assert.deepEqual(
//   params('/users/john/messages/123'),
//   { 'userId': 'john', 'messageId': '123' }
// );
export type ParametersFn = (path: Path) => Parameters | null;

// assert.deepEqual(
//   path({ 'userId': 'john', 'messageId': '123' }),
//   '/users/john/messages/123'
// );
export type PathFn = (params: Parameters) => Path | null;

// const { params, path } = bath('/users/{userId}/messages/{messageId}')
export type Bath = (
  template: PathTemplate,
  patterns?: ParameterPatterns
) => { names: ParameterName[]; path: PathFn; params: ParametersFn; };
```

## Related Project

- [bouzuya/spa-town][] ... A simple router based on bath.

[bouzuya/spa-town]: https://github.com/bouzuya/spa-town

## Badges

[![npm version][npm-badge-url]][npm-url]
[![Travis CI][travisci-badge-url]][travisci-url]
[![Coveralls][coveralls-badge-url]][coveralls-url]

[npm-badge-url]: https://badge.fury.io/js/bath.svg
[npm-url]: https://www.npmjs.com/package/bath
[travisci-badge-url]: https://travis-ci.org/bouzuya/bath.svg?branch=master
[travisci-url]: https://travis-ci.org/bouzuya/bath
[coveralls-url]: https://coveralls.io/github/bouzuya/bath
[coveralls-badge-url]: https://img.shields.io/coveralls/github/bouzuya/bath.svg

## License

[MIT](LICENSE)

## Author

[bouzuya][user] &lt;[m@bouzuya.net][email]&gt; ([http://bouzuya.net][url])

[user]: https://github.com/bouzuya
[email]: mailto:m@bouzuya.net
[url]: http://bouzuya.net
