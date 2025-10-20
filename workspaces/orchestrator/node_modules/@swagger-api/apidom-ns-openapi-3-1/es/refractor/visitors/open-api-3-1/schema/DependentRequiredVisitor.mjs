import { FallbackVisitor } from '@swagger-api/apidom-ns-openapi-3-0';
class DependentRequiredVisitor extends FallbackVisitor {
  ObjectElement(objectElement) {
    const result = super.enter(objectElement);
    this.element.classes.push('json-schema-dependentRequired');
    return result;
  }
}
export default DependentRequiredVisitor;