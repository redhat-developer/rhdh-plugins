"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _Components = _interopRequireDefault(require("../../../../elements/Components.cjs"));
const {
  visitors: {
    document: {
      objects: {
        Components: {
          $visitor: BaseComponentsVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class ComponentsVisitor extends BaseComponentsVisitor {
  constructor(options) {
    super(options);
    this.element = new _Components.default();
  }
}
var _default = exports.default = ComponentsVisitor;