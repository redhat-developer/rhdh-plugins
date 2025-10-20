import { specificationObj as JSONSchemaDraft4Specification, isJSONReferenceElement } from '@swagger-api/apidom-ns-json-schema-draft-4';
const {
  properties: JSONSchemaPropertiesVisitor
} = JSONSchemaDraft4Specification.visitors.document.objects.JSONSchema.fixedFields;
class PropertiesVisitor extends JSONSchemaPropertiesVisitor {
  ObjectElement(objectElement) {
    const result = JSONSchemaPropertiesVisitor.prototype.ObjectElement.call(this, objectElement);
    this.element.filter(isJSONReferenceElement)
    // @ts-ignore
    .forEach(referenceElement => {
      referenceElement.setMetaProperty('referenced-element', 'schema');
    });
    return result;
  }
}
export default PropertiesVisitor;