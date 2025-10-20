"use strict";

exports.__esModule = true;
exports.isPosition = exports.isPoint = exports.isParseResult = exports.isNodeType = exports.isLiteral = void 0;
const isNodeType = (type, node) => node != null && typeof node === 'object' && 'type' in node && node.type === type;
exports.isNodeType = isNodeType;
const isLiteral = node => isNodeType('literal', node);
exports.isLiteral = isLiteral;
const isPosition = node => isNodeType('position', node);
exports.isPosition = isPosition;
const isPoint = node => isNodeType('point', node);
exports.isPoint = isPoint;
const isParseResult = node => isNodeType('parseResult', node);
exports.isParseResult = isParseResult;