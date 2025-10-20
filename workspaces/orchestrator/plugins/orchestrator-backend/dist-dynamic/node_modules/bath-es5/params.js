"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.params = void 0;

var _toParameterPattern = require("./_/to-parameter-pattern");

const params = (template, patterns) => {
  const notFound = null;
  const pathPattern = toPathPattern(template);
  const parameterPattern = (0, _toParameterPattern.toParameterPattern)(template, patterns);
  return pathname => {
    const vs = matchPathPattern(pathname, pathPattern);
    if (vs === null) return notFound;
    const npvs = matchParameterPattern(vs, parameterPattern);
    if (npvs === null) return notFound;
    return toParameters(npvs);
  };
};

exports.params = params;

const toParameters = npvs => {
  return npvs.map(({
    name,
    value
  }) => ({
    [name]: value
  })).reduce((a, x) => Object.assign(a, x), {});
};

const matchParameterPattern = (parameterValues, parameterPattern) => {
  const npvs = parameterValues.map(({
    value
  }) => decodeURIComponent(value)).map((value, i) => {
    const {
      name,
      pattern
    } = parameterPattern[i];
    return {
      name,
      pattern,
      value
    };
  });
  const hasUnmatchParameter = npvs.some(({
    pattern,
    value
  }) => {
    return pattern !== null && value.match(pattern) === null;
  });
  if (hasUnmatchParameter) return null;
  const hasInvalidDuplicatedParameter = npvs.some(({
    name,
    value
  }) => {
    return npvs.some(({
      name: n,
      value: v
    }) => n === name && v !== value);
  });
  if (hasInvalidDuplicatedParameter) return null;
  return npvs;
};

const matchPathPattern = (pathname, pathPattern) => {
  const m = pathname.match(pathPattern);
  if (m === null) return null;
  const vs = m.slice(1).map(value => ({
    value
  }));
  return vs;
};

const toPathPattern = template => {
  return new RegExp('^' + template.replace(/\{[A-Za-z0-9_-]+\}/g, '([^\\/]*)') + '$');
};