"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _Xml = _interopRequireDefault(require("../../../../elements/Xml.cjs"));
const {
  visitors: {
    document: {
      objects: {
        XML: {
          $visitor: BaseXMLVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class XmlVisitor extends BaseXMLVisitor {
  constructor(options) {
    super(options);
    this.element = new _Xml.default();
  }
}
var _default = exports.default = XmlVisitor;