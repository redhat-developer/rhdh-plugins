# mock-json-schema
[![CI](https://github.com/anttiviljami/mock-json-schema/workflows/CI/badge.svg)](https://github.com/anttiviljami/mock-json-schema/actions?query=workflow%3ACI)
[![Dependencies](https://david-dm.org/anttiviljami/mock-json-schema.svg)](https://david-dm.org/anttiviljami/mock-json-schema)
[![npm version](https://img.shields.io/npm/v/mock-json-schema.svg)](https://www.npmjs.com/package/mock-json-schema)
[![npm downloads](https://img.shields.io/npm/dw/mock-json-schema)](https://www.npmjs.com/package/mock-json-schema)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/anttiviljami/mock-json-schema.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/anttiviljami/mock-json-schema/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/anttiviljami/mock-json-schema.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/anttiviljami/mock-json-schema/context:javascript)
[![License](http://img.shields.io/:license-mit-blue.svg)](https://github.com/anttiviljami/mock-json-schema/blob/master/LICENSE)
[![Sponsored](https://img.shields.io/badge/chilicorn-sponsored-brightgreen.svg?logo=data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAAA4AAAAPCAMAAADjyg5GAAABqlBMVEUAAAAzmTM3pEn%2FSTGhVSY4ZD43STdOXk5lSGAyhz41iz8xkz2HUCWFFhTFFRUzZDvbIB00Zzoyfj9zlHY0ZzmMfY0ydT0zjj92l3qjeR3dNSkoZp4ykEAzjT8ylUBlgj0yiT0ymECkwKjWqAyjuqcghpUykD%2BUQCKoQyAHb%2BgylkAyl0EynkEzmkA0mUA3mj86oUg7oUo8n0k%2FS%2Bw%2Fo0xBnE5BpU9Br0ZKo1ZLmFZOjEhesGljuzllqW50tH14aS14qm17mX9%2Bx4GAgUCEx02JySqOvpSXvI%2BYvp2orqmpzeGrQh%2Bsr6yssa2ttK6v0bKxMBy01bm4zLu5yry7yb29x77BzMPCxsLEzMXFxsXGx8fI3PLJ08vKysrKy8rL2s3MzczOH8LR0dHW19bX19fZ2dna2trc3Nzd3d3d3t3f39%2FgtZTg4ODi4uLj4%2BPlGxLl5eXm5ubnRzPn5%2Bfo6Ojp6enqfmzq6urr6%2Bvt7e3t7u3uDwvugwbu7u7v6Obv8fDz8%2FP09PT2igP29vb4%2BPj6y376%2Bu%2F7%2Bfv9%2Ff39%2Fv3%2BkAH%2FAwf%2FtwD%2F9wCyh1KfAAAAKXRSTlMABQ4VGykqLjVCTVNgdXuHj5Kaq62vt77ExNPX2%2Bju8vX6%2Bvr7%2FP7%2B%2FiiUMfUAAADTSURBVAjXBcFRTsIwHAfgX%2FtvOyjdYDUsRkFjTIwkPvjiOTyX9%2FAIJt7BF570BopEdHOOstHS%2BX0s439RGwnfuB5gSFOZAgDqjQOBivtGkCc7j%2B2e8XNzefWSu%2BsZUD1QfoTq0y6mZsUSvIkRoGYnHu6Yc63pDCjiSNE2kYLdCUAWVmK4zsxzO%2BQQFxNs5b479NHXopkbWX9U3PAwWAVSY%2FpZf1udQ7rfUpQ1CzurDPpwo16Ff2cMWjuFHX9qCV0Y0Ok4Jvh63IABUNnktl%2B6sgP%2BARIxSrT%2FMhLlAAAAAElFTkSuQmCC)](http://spiceprogram.org/oss-sponsorship)
[![Buy me a coffee](https://img.shields.io/badge/donate-buy%20me%20a%20coffee-orange)](https://buymeacoff.ee/anttiviljami)

Simple utility to mock example objects based on JSON schema definitions

## Features

- [x] Minimal & deterministic. Predictable single example with no randomisation involved
- [x] Thoroughly [tested](https://github.com/anttiviljami/mock-json-schema/blob/master/src/mock.test.ts) feature set
- [x] Supports `example`, `default`
- [x] Supports `anyOf`, `allOf`, `oneOf`
- [x] Built-in examples for following string formats:
	- `email`
	- `hostname`
	- `ipv4`
	- `ipv6`
	- `uri`
	- `uri-reference`
	- `uri-template`
	- `json-pointer`
	- `date-time`
	- `uuid`
- [x] TypeScript types included
- [ ] Supports $ref pointers

## Usage

```javascript
const { mock } = require('mock-json-schema');
const assert = require('assert');

const schema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        minimum: 1,
      },
      name: {
        type: 'string',
        example: 'John Doe',
      },
      email: {
        type: 'string',
        format: 'email',
      },
    },
  },
};

assert.deepEqual(mock(schema), [{ id: 1, name: 'John Doe', email: 'user@example.com' }]);
```

View more [examples](https://github.com/anttiviljami/mock-json-schema/blob/master/src/mock.test.ts)

## Contributing

mock-json-schema is Free and Open Source Software. Issues and pull requests are more than welcome!

[<img alt="The Chilicorn" src="http://spiceprogram.org/assets/img/chilicorn_sticker.svg" width="250" height="250">](https://spiceprogram.org/oss-sponsorship)

