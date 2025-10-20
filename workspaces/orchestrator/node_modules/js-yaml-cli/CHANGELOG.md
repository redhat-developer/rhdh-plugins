# Changelog

## 0.6.0 - 2014-01-07
- improved documentation
- console output moved to an extra utility component
- upgraded dependency to `lodash`from 2.2.1 to 2.4.1
- upgraded dependency to `js-yaml`from 2.1.3 to 3.0.1
- added `coffeelint` checks

## 0.5.1 - 2013-11-11
- fixed documentation

## 0.5.0 - 2013-11-08
- no changes to `0.4.0`. Accidentally released.

## 0.4.0 - 2013-11-08
- removed command-line option `-j`. Correct JSON will be generated without having to specify a command-line option.
  Other formats may be generated using a command-line option, later.

## 0.3.0 - 2013-10-30
- added `"use strict"` to both scripts in `bin`
- supports reading YAML input from stdin

## 0.2.0 - 2013-10-30
- many fixes
- added command-line options `-r`, `-m`, `f`
- argument `SOURCE` may also be a directory and is optional
- improved help text
- improved documentation
- added `npm` `prepublish` script to compile `.coffee` files to `.js` ones

## 0.1.0 - 2013-10-29
- First public release
