import { BREAK, cloneDeep } from '@swagger-api/apidom-core';
import SwaggerSchemesElement from "../../../elements/nces/SwaggerSchemes.mjs";
import FallbackVisitor from "../FallbackVisitor.mjs";
class SchemesVisitor extends FallbackVisitor {
  constructor(options) {
    super(options);
    this.element = new SwaggerSchemesElement();
  }
  ArrayElement(arrayElement) {
    this.element = this.element.concat(cloneDeep(arrayElement));
    return BREAK;
  }
}
export default SchemesVisitor;