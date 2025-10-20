"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _Server = _interopRequireDefault(require("../../../../elements/Server.cjs"));
const {
  visitors: {
    document: {
      objects: {
        Server: {
          $visitor: BaseServerVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class ServerVisitor extends BaseServerVisitor {
  constructor(options) {
    super(options);
    this.element = new _Server.default();
  }
}
var _default = exports.default = ServerVisitor;