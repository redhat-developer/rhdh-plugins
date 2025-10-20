"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.path = void 0;

var _pathTemplateToParameterNames = require("./_/path-template-to-parameter-names");

var _toParameterPattern = require("./_/to-parameter-pattern");

const path = (template, patterns) => {
  const parameterNames = (0, _pathTemplateToParameterNames.pathTempalteToParameterNames)(template);
  return params => {
    if (parameterNames.some(name => typeof params[name] !== 'string')) {
      return null;
    }

    const parameterPattern = (0, _toParameterPattern.toParameterPattern)(template, patterns);

    if (parameterPattern.some(({
      name,
      pattern
    }) => {
      return pattern !== null && params[name].match(pattern) === null;
    })) {
      return null;
    }

    return parameterNames.reduce((a, name) => {
      return a.split('{' + name + '}').join(encodeURIComponent(params[name]));
    }, template);
  };
};

exports.path = path;