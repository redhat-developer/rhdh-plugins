"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _Response = _interopRequireDefault(require("../../../../elements/Response.cjs"));
const {
  visitors: {
    document: {
      objects: {
        Response: {
          $visitor: BaseResponseVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class ResponseVisitor extends BaseResponseVisitor {
  constructor(options) {
    super(options);
    this.element = new _Response.default();
  }
}
var _default = exports.default = ResponseVisitor;