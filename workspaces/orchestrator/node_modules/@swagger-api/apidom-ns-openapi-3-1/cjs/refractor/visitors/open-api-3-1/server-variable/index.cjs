"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _ServerVariable = _interopRequireDefault(require("../../../../elements/ServerVariable.cjs"));
const {
  visitors: {
    document: {
      objects: {
        ServerVariable: {
          $visitor: BaseServerVariableVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class ServerVariableVisitor extends BaseServerVariableVisitor {
  constructor(options) {
    super(options);
    this.element = new _ServerVariable.default();
  }
}
var _default = exports.default = ServerVariableVisitor;