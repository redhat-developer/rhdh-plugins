"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _License = _interopRequireDefault(require("../../../../elements/License.cjs"));
const {
  visitors: {
    document: {
      objects: {
        License: {
          $visitor: BaseLicenseVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class LicenseVisitor extends BaseLicenseVisitor {
  constructor(options) {
    super(options);
    this.element = new _License.default();
  }
}
var _default = exports.default = LicenseVisitor;