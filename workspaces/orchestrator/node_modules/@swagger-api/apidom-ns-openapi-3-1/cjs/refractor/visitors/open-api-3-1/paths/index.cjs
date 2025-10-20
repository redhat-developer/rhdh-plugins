"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _Paths = _interopRequireDefault(require("../../../../elements/Paths.cjs"));
const {
  visitors: {
    document: {
      objects: {
        Paths: {
          $visitor: BasePathsVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class PathsVisitor extends BasePathsVisitor {
  constructor(options) {
    super(options);
    this.element = new _Paths.default();
  }
}
var _default = exports.default = PathsVisitor;