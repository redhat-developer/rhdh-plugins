"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _SecurityRequirement = _interopRequireDefault(require("../../../../elements/SecurityRequirement.cjs"));
const {
  visitors: {
    document: {
      objects: {
        SecurityRequirement: {
          $visitor: BaseSecurityRequirementVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class SecurityRequirementVisitor extends BaseSecurityRequirementVisitor {
  constructor(options) {
    super(options);
    this.element = new _SecurityRequirement.default();
  }
}
var _default = exports.default = SecurityRequirementVisitor;