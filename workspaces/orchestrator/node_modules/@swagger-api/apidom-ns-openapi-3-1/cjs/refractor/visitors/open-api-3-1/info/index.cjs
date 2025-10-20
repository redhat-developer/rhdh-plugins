"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _Info = _interopRequireDefault(require("../../../../elements/Info.cjs"));
const {
  visitors: {
    document: {
      objects: {
        Info: {
          $visitor: BaseInfoVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class InfoVisitor extends BaseInfoVisitor {
  constructor(options) {
    super(options);
    this.element = new _Info.default();
  }
}
var _default = exports.default = InfoVisitor;