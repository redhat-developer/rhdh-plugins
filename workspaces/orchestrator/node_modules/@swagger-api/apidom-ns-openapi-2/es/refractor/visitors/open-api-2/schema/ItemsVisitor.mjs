import { specificationObj as JSONSchemaDraft4Specification, isJSONReferenceElement } from '@swagger-api/apidom-ns-json-schema-draft-4';
const {
  items: JSONSchemaItemsVisitor
} = JSONSchemaDraft4Specification.visitors.document.objects.JSONSchema.fixedFields;
class ItemsVisitor extends JSONSchemaItemsVisitor {
  ObjectElement(objectElement) {
    const result = JSONSchemaItemsVisitor.prototype.ObjectElement.call(this, objectElement);
    if (isJSONReferenceElement(this.element)) {
      this.element.setMetaProperty('referenced-element', 'schema');
    }
    return result;
  }
  ArrayElement(arrayElement) {
    const result = JSONSchemaItemsVisitor.prototype.ArrayElement.call(this, arrayElement);
    this.element.filter(isJSONReferenceElement)
    // @ts-ignore
    .forEach(referenceElement => {
      referenceElement.setMetaProperty('referenced-element', 'schema');
    });
    return result;
  }
}
export default ItemsVisitor;