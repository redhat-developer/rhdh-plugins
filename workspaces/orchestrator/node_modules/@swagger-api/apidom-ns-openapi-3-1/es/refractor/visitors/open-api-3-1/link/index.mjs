import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import LinkElement from "../../../../elements/Link.mjs";
const {
  visitors: {
    document: {
      objects: {
        Link: {
          $visitor: BaseLinkVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class LinkVisitor extends BaseLinkVisitor {
  constructor(options) {
    super(options);
    this.element = new LinkElement();
  }
}
export default LinkVisitor;