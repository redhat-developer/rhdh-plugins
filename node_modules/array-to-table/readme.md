# Array to Table

Convert an array of objects to a simple markdown table.

[![version][npm-version]][npm-url]
[![License][npm-license]][license-url]
[![Downloads][npm-downloads]][npm-url]
[![Dependencies][david-image]][david-url]

## Install

- Download [the latest package][download]
- NPM: `npm install array-to-table`

## Usage

**Node.js / Browserify**

```js
var arrayToTable = require('array-to-table')
```

## Example

**Input**

```js
arrayToTable([{
  Id: '004',
  Icon: '![004](http://www.psypokes.com/dex/picdex/minis/004.png)',
  Name: 'Charmander',
},{
  Id: '005',
  Icon: '![005](http://www.psypokes.com/dex/picdex/minis/005.png)',
  Name: 'Charmeleon',
},{
  Id: '006',
  Icon: '![006](http://www.psypokes.com/dex/picdex/minis/006.png)',
  Name: 'Charizard',
},{
  Id: '151',
  Icon: '![151](http://www.psypokes.com/dex/picdex/minis/151.png)',
  Name: 'Mew'
}])
```

**Output**

Id | Icon | Name
--- | --- | ---
004 | ![004](http://www.psypokes.com/dex/picdex/minis/004.png) | Charmander
005 | ![005](http://www.psypokes.com/dex/picdex/minis/005.png) | Charmeleon
006 | ![006](http://www.psypokes.com/dex/picdex/minis/006.png) | Charizard
151 | ![151](http://www.psypokes.com/dex/picdex/minis/151.png) | Mew

## License

Licensed under [The MIT License](LICENSE).

[license-url]: https://github.com/Nijikokun/array-to-table/blob/master/LICENSE

[travis-url]: https://travis-ci.org/Nijikokun/array-to-table
[travis-image]: https://img.shields.io/travis/Nijikokun/array-to-table.svg?style=flat

[npm-url]: https://www.npmjs.com/package/array-to-table
[npm-license]: https://img.shields.io/npm/l/array-to-table.svg?style=flat
[npm-version]: https://img.shields.io/npm/v/array-to-table.svg?style=flat
[npm-downloads]: https://img.shields.io/npm/dm/array-to-table.svg?style=flat

[codeclimate-url]: https://codeclimate.com/github/Nijikokun/array-to-table
[codeclimate-quality]: https://img.shields.io/codeclimate/github/Nijikokun/array-to-table.svg?style=flat
[codeclimate-coverage]: https://img.shields.io/codeclimate/coverage/github/Nijikokun/array-to-table.svg?style=flat

[david-url]: https://david-dm.org/Nijikokun/array-to-table
[david-image]: https://img.shields.io/david/Nijikokun/array-to-table.svg?style=flat

[download]: https://github.com/Nijikokun/array-to-table/archive/v1.0.1.zip
