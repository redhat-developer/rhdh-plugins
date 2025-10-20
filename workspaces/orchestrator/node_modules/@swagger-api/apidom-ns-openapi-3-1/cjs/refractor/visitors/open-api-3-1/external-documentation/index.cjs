"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _ExternalDocumentation = _interopRequireDefault(require("../../../../elements/ExternalDocumentation.cjs"));
const {
  visitors: {
    document: {
      objects: {
        ExternalDocumentation: {
          $visitor: BaseExternalDocumentationVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class ExternalDocumentationVisitor extends BaseExternalDocumentationVisitor {
  constructor(options) {
    super(options);
    this.element = new _ExternalDocumentation.default();
  }
}
var _default = exports.default = ExternalDocumentationVisitor;