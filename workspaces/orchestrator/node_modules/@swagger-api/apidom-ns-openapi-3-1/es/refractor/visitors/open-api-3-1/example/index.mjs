import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import ExampleElement from "../../../../elements/Example.mjs";
const {
  visitors: {
    document: {
      objects: {
        Example: {
          $visitor: BaseExampleVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class ExampleVisitor extends BaseExampleVisitor {
  constructor(options) {
    super(options);
    this.element = new ExampleElement();
  }
}
export default ExampleVisitor;