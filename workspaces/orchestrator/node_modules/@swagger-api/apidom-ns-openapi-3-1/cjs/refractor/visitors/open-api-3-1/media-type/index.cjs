"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _MediaType = _interopRequireDefault(require("../../../../elements/MediaType.cjs"));
const {
  visitors: {
    document: {
      objects: {
        MediaType: {
          $visitor: BaseMediaTypeVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class MediaTypeVisitor extends BaseMediaTypeVisitor {
  constructor(options) {
    super(options);
    this.element = new _MediaType.default();
  }
}
var _default = exports.default = MediaTypeVisitor;