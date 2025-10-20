"use strict";

exports.__esModule = true;
exports.default = void 0;
var _apidomNsJsonSchemaDraft = require("@swagger-api/apidom-ns-json-schema-draft-4");
const {
  items: JSONSchemaItemsVisitor
} = _apidomNsJsonSchemaDraft.specificationObj.visitors.document.objects.JSONSchema.fixedFields;
class ItemsVisitor extends JSONSchemaItemsVisitor {
  ObjectElement(objectElement) {
    const result = JSONSchemaItemsVisitor.prototype.ObjectElement.call(this, objectElement);
    if ((0, _apidomNsJsonSchemaDraft.isJSONReferenceElement)(this.element)) {
      this.element.setMetaProperty('referenced-element', 'schema');
    }
    return result;
  }
  ArrayElement(arrayElement) {
    const result = JSONSchemaItemsVisitor.prototype.ArrayElement.call(this, arrayElement);
    this.element.filter(_apidomNsJsonSchemaDraft.isJSONReferenceElement)
    // @ts-ignore
    .forEach(referenceElement => {
      referenceElement.setMetaProperty('referenced-element', 'schema');
    });
    return result;
  }
}
var _default = exports.default = ItemsVisitor;