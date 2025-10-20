"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _OAuthFlows = _interopRequireDefault(require("../../../../elements/OAuthFlows.cjs"));
const {
  visitors: {
    document: {
      objects: {
        OAuthFlows: {
          $visitor: BaseOAuthFlowsVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class OAuthFlowsVisitor extends BaseOAuthFlowsVisitor {
  constructor(options) {
    super(options);
    this.element = new _OAuthFlows.default();
  }
}
var _default = exports.default = OAuthFlowsVisitor;