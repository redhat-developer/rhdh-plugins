"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _RequestBody = _interopRequireDefault(require("../../../../elements/RequestBody.cjs"));
const {
  visitors: {
    document: {
      objects: {
        RequestBody: {
          $visitor: BaseRequestBodyVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class RequestBodyVisitor extends BaseRequestBodyVisitor {
  constructor(options) {
    super(options);
    this.element = new _RequestBody.default();
  }
}
var _default = exports.default = RequestBodyVisitor;