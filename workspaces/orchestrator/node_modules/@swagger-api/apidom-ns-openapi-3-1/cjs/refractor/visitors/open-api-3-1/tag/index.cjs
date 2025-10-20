"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _Tag = _interopRequireDefault(require("../../../../elements/Tag.cjs"));
const {
  visitors: {
    document: {
      objects: {
        Tag: {
          $visitor: BaseTagVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class TagVisitor extends BaseTagVisitor {
  constructor(options) {
    super(options);
    this.element = new _Tag.default();
  }
}
var _default = exports.default = TagVisitor;