"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.names = void 0;

var _pathTemplateToParameterNames = require("./_/path-template-to-parameter-names");

const names = template => {
  const ns = (0, _pathTemplateToParameterNames.pathTempalteToParameterNames)(template);
  return ns.filter((i, index, array) => array.indexOf(i) === index);
};

exports.names = names;