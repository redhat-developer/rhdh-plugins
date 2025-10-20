"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _Link = _interopRequireDefault(require("../../../../elements/Link.cjs"));
const {
  visitors: {
    document: {
      objects: {
        Link: {
          $visitor: BaseLinkVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class LinkVisitor extends BaseLinkVisitor {
  constructor(options) {
    super(options);
    this.element = new _Link.default();
  }
}
var _default = exports.default = LinkVisitor;