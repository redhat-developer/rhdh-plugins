import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import ComponentsElement from "../../../../elements/Components.mjs";
const {
  visitors: {
    document: {
      objects: {
        Components: {
          $visitor: BaseComponentsVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class ComponentsVisitor extends BaseComponentsVisitor {
  constructor(options) {
    super(options);
    this.element = new ComponentsElement();
  }
}
export default ComponentsVisitor;