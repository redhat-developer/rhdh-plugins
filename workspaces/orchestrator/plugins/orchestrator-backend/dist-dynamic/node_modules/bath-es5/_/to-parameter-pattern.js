"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toParameterPattern = void 0;

var _pathTemplateToParameterNames = require("./path-template-to-parameter-names");

const toParameterPattern = (template, patterns) => {
  const userParameterPatterns = typeof patterns === 'undefined' ? [] : Object.keys(patterns).map(name => {
    const patternOrUndefined = patterns[name];
    const pattern = typeof patternOrUndefined === 'undefined' ? null : patternOrUndefined;
    return {
      name,
      pattern
    };
  });
  const parameterNames = (0, _pathTemplateToParameterNames.pathTempalteToParameterNames)(template);
  const parameters = parameterNames.map(name => {
    const userPattern = userParameterPatterns.find(({
      name: n
    }) => n === name);
    const pattern = typeof userPattern === 'undefined' ? null : userPattern.pattern;
    return {
      name,
      pattern
    };
  });
  return parameters;
};

exports.toParameterPattern = toParameterPattern;