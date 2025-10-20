"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "names", {
  enumerable: true,
  get: function () {
    return _names.names;
  }
});
Object.defineProperty(exports, "params", {
  enumerable: true,
  get: function () {
    return _params.params;
  }
});
Object.defineProperty(exports, "path", {
  enumerable: true,
  get: function () {
    return _path.path;
  }
});
exports.bath = exports.default = void 0;

var _names = require("./names");

var _params = require("./params");

var _path = require("./path");

const bath = (template, patterns) => {
  const names = (0, _names.names)(template);
  const path = (0, _path.path)(template, patterns);
  const params = (0, _params.params)(template, patterns);
  return {
    names,
    path,
    params
  };
};

exports.bath = bath;
var _default = bath;
exports.default = _default;