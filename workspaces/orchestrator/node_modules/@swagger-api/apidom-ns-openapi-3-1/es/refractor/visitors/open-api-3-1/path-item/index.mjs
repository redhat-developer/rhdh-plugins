import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import PathItemElement from "../../../../elements/PathItem.mjs";
const {
  visitors: {
    document: {
      objects: {
        PathItem: {
          $visitor: BasePathItemVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class PathItemVisitor extends BasePathItemVisitor {
  constructor(options) {
    super(options);
    this.element = new PathItemElement();
  }
}
export default PathItemVisitor;