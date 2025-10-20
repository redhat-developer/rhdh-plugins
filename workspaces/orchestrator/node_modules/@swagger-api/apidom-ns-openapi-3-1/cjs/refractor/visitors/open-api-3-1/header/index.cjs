"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _Header = _interopRequireDefault(require("../../../../elements/Header.cjs"));
const {
  visitors: {
    document: {
      objects: {
        Header: {
          $visitor: BaseHeaderVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class HeaderVisitor extends BaseHeaderVisitor {
  constructor(options) {
    super(options);
    this.element = new _Header.default();
  }
}
var _default = exports.default = HeaderVisitor;