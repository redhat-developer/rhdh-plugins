import { specificationObj as JSONSchemaDraft7Specification } from '@swagger-api/apidom-ns-json-schema-draft-7';
import { isReferenceElement } from "../../../../predicates.mjs";
const {
  allOf: JSONSchemaAllOfVisitor
} = JSONSchemaDraft7Specification.visitors.document.objects.JSONSchema.fixedFields;
class AllOfVisitor extends JSONSchemaAllOfVisitor {
  ArrayElement(arrayElement) {
    const result = JSONSchemaAllOfVisitor.prototype.ArrayElement.call(this, arrayElement);

    // @ts-ignore
    this.element.filter(isReferenceElement).forEach(referenceElement => {
      referenceElement.setMetaProperty('referenced-element', 'schema');
    });
    return result;
  }
}
export default AllOfVisitor;