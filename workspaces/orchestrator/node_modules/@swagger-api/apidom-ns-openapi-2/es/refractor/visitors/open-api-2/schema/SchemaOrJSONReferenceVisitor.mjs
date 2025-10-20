import { specificationObj as JSONSchemaDraft4Specification, isJSONReferenceElement } from '@swagger-api/apidom-ns-json-schema-draft-4';
const {
  JSONSchemaOrJSONReferenceVisitor
} = JSONSchemaDraft4Specification.visitors;
class SchemaOrJSONReferenceVisitor extends JSONSchemaOrJSONReferenceVisitor {
  ObjectElement(objectElement) {
    const result = JSONSchemaOrJSONReferenceVisitor.prototype.enter.call(this, objectElement);
    if (isJSONReferenceElement(this.element)) {
      this.element.setMetaProperty('referenced-element', 'schema');
    }
    return result;
  }
}
export default SchemaOrJSONReferenceVisitor;