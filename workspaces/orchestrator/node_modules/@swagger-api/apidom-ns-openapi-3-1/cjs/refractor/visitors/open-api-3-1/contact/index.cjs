"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _Contact = _interopRequireDefault(require("../../../../elements/Contact.cjs"));
const {
  visitors: {
    document: {
      objects: {
        Contact: {
          $visitor: BaseContactVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class ContactVisitor extends BaseContactVisitor {
  constructor(options) {
    super(options);
    this.element = new _Contact.default();
  }
}
var _default = exports.default = ContactVisitor;