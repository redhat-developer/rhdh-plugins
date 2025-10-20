"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _Responses = _interopRequireDefault(require("../../../../elements/Responses.cjs"));
const {
  visitors: {
    document: {
      objects: {
        Responses: {
          $visitor: BaseResponsesVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class ResponsesVisitor extends BaseResponsesVisitor {
  constructor(options) {
    super(options);
    this.element = new _Responses.default();
  }
}
var _default = exports.default = ResponsesVisitor;