import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import DiscriminatorElement from "../../../../elements/Discriminator.mjs";
const {
  visitors: {
    document: {
      objects: {
        Discriminator: {
          $visitor: BaseDiscriminatorVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class DiscriminatorVisitor extends BaseDiscriminatorVisitor {
  constructor(options) {
    super(options);
    this.element = new DiscriminatorElement();
    this.canSupportSpecificationExtensions = true;
  }
}
export default DiscriminatorVisitor;