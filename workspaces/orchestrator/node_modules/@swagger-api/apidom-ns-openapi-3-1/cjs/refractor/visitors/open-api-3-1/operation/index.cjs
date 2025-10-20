"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
exports.__esModule = true;
exports.default = void 0;
var _apidomNsOpenapi = require("@swagger-api/apidom-ns-openapi-3-0");
var _Operation = _interopRequireDefault(require("../../../../elements/Operation.cjs"));
const {
  visitors: {
    document: {
      objects: {
        Operation: {
          $visitor: BaseOperationVisitor
        }
      }
    }
  }
} = _apidomNsOpenapi.specificationObj;
class OperationVisitor extends BaseOperationVisitor {
  constructor(options) {
    super(options);
    this.element = new _Operation.default();
  }
}
var _default = exports.default = OperationVisitor;