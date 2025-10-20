"use strict";

exports.__esModule = true;
exports.default = exports.Point = void 0;
/* eslint-disable max-classes-per-file */

class Point {
  static type = 'point';
  type = Point.type;
  row;
  column;
  char;
  constructor({
    row,
    column,
    char
  }) {
    this.row = row;
    this.column = column;
    this.char = char;
  }
}
exports.Point = Point;
class Position {
  static type = 'position';
  type = Position.type;
  start;
  end;
  constructor({
    start,
    end
  }) {
    this.start = start;
    this.end = end;
  }
}
var _default = exports.default = Position;