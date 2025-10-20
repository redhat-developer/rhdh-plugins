"use strict";

exports.__esModule = true;
exports.default = void 0;
var _apidomNsJsonSchemaDraft = require("@swagger-api/apidom-ns-json-schema-draft-4");
var _predicates = require("../../../../predicates.cjs");
const {
  allOf: JSONSchemaAllOfVisitor
} = _apidomNsJsonSchemaDraft.specificationObj.visitors.document.objects.JSONSchema.fixedFields;
class AllOfVisitor extends JSONSchemaAllOfVisitor {
  ArrayElement(arrayElement) {
    const result = JSONSchemaAllOfVisitor.prototype.ArrayElement.call(this, arrayElement);

    // @ts-ignore
    this.element.filter(_predicates.isReferenceElement).forEach(referenceElement => {
      referenceElement.setMetaProperty('referenced-element', 'schema');
    });
    return result;
  }
}
var _default = exports.default = AllOfVisitor;