import { specificationObj as JSONSchemaDraft4Specification, isJSONReferenceElement } from '@swagger-api/apidom-ns-json-schema-draft-4';
const {
  allOf: JSONSchemaAllOfVisitor
} = JSONSchemaDraft4Specification.visitors.document.objects.JSONSchema.fixedFields;
class AllOfVisitor extends JSONSchemaAllOfVisitor {
  ArrayElement(arrayElement) {
    const result = JSONSchemaAllOfVisitor.prototype.ArrayElement.call(this, arrayElement);
    this.element.filter(isJSONReferenceElement)
    // @ts-ignore
    .forEach(referenceElement => {
      referenceElement.setMetaProperty('referenced-element', 'schema');
    });
    return result;
  }
}
export default AllOfVisitor;