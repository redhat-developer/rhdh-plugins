import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import PathsElement from "../../../../elements/Paths.mjs";
const {
  visitors: {
    document: {
      objects: {
        Paths: {
          $visitor: BasePathsVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class PathsVisitor extends BasePathsVisitor {
  constructor(options) {
    super(options);
    this.element = new PathsElement();
  }
}
export default PathsVisitor;