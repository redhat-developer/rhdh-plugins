var arrayToTable = require('./index')
var tess = require('tess')
var assert = require('assert')

var fixture = [
  { a: '1', b: '2', c: '3' },
  { a: 'd', b: 'e', c: 'f' },
  { a: 'q', b: 'r', c: 's' }
]

var fixtureResult = [
  "a | b | c",
  "--- | --- | ---",
  "1 | 2 | 3",
  "d | e | f",
  "q | r | s",
  ""
].join("\r\n")

tess('array-to-table', function (it) {
  it('should properly generate a table', function () {
    assert(arrayToTable(fixture) === fixtureResult)
  })
})
