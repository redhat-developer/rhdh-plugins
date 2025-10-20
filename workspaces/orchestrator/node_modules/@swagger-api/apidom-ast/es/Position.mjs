/* eslint-disable max-classes-per-file */

export class Point {
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
export default Position;