"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pathTempalteToParameterNames = void 0;

const pathTempalteToParameterNames = template => {
  const nameMatcher = template.match(/\{[A-Za-z0-9_-]+\}/g);
  return nameMatcher === null ? [] : nameMatcher.map(x => x.substring(1, x.length - 1));
};

exports.pathTempalteToParameterNames = pathTempalteToParameterNames;