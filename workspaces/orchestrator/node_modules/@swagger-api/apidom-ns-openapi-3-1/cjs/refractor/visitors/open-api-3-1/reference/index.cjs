"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _Reference = _interopRequireDefault(require("../../../../elements/Reference.cjs"));
const {
  visitors: {
    document: {
      objects: {
        Reference: {
          $visitor: BaseReferenceVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class ReferenceVisitor extends BaseReferenceVisitor {
  constructor(options) {
    super(options);
    this.element = new _Reference.default();
  }
}
var _default = exports.default = ReferenceVisitor;