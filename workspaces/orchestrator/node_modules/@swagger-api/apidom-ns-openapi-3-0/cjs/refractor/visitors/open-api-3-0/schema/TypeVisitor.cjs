"use strict";

exports.__esModule = true;
exports.default = void 0;
var _apidomNsJsonSchemaDraft = require("@swagger-api/apidom-ns-json-schema-draft-4");
const {
  type: JSONSchemaTypeVisitor
} = _apidomNsJsonSchemaDraft.specificationObj.visitors.document.objects.JSONSchema.fixedFields;
class TypeVisitor extends JSONSchemaTypeVisitor {
  ArrayElement(arrayElement) {
    const result = this.enter(arrayElement);
    return result;
  }
}
var _default = exports.default = TypeVisitor;