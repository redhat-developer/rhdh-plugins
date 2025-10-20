"use strict";

exports.__esModule = true;
exports.default = void 0;
var _apidomNsJsonSchemaDraft = require("@swagger-api/apidom-ns-json-schema-draft-4");
const {
  JSONSchemaOrJSONReferenceVisitor
} = _apidomNsJsonSchemaDraft.specificationObj.visitors;
class SchemaOrJSONReferenceVisitor extends JSONSchemaOrJSONReferenceVisitor {
  ObjectElement(objectElement) {
    const result = JSONSchemaOrJSONReferenceVisitor.prototype.enter.call(this, objectElement);
    if ((0, _apidomNsJsonSchemaDraft.isJSONReferenceElement)(this.element)) {
      this.element.setMetaProperty('referenced-element', 'schema');
    }
    return result;
  }
}
var _default = exports.default = SchemaOrJSONReferenceVisitor;