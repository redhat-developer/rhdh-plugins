import { FallbackVisitor } from '@swagger-api/apidom-ns-json-schema-draft-4';
class ExamplesVisitor extends FallbackVisitor {
  ArrayElement(arrayElement) {
    const result = this.enter(arrayElement);
    this.element.classes.push('json-schema-examples');
    return result;
  }
}
export default ExamplesVisitor;