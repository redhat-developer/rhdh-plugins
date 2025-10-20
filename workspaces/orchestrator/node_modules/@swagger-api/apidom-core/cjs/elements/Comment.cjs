"use strict";

exports.__esModule = true;
exports.default = void 0;
var _minim = require("minim");
class Comment extends _minim.StringElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'comment';
  }
}
var _default = exports.default = Comment;