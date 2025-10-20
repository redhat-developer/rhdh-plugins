"use strict";

exports.__esModule = true;
exports.default = void 0;
var _ramda = require("ramda");
// escape :: String -> String
const escape = (0, _ramda.pipe)((0, _ramda.replace)(/~/g, '~0'), (0, _ramda.replace)(/\//g, '~1'), encodeURIComponent);
var _default = exports.default = escape;