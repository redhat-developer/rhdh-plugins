import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import ReferenceElement from "../../../../elements/Reference.mjs";
const {
  visitors: {
    document: {
      objects: {
        Reference: {
          $visitor: BaseReferenceVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class ReferenceVisitor extends BaseReferenceVisitor {
  constructor(options) {
    super(options);
    this.element = new ReferenceElement();
  }
}
export default ReferenceVisitor;