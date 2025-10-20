import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import EncodingElement from "../../../../elements/Encoding.mjs";
const {
  visitors: {
    document: {
      objects: {
        Encoding: {
          $visitor: BaseEncodingVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class EncodingVisitor extends BaseEncodingVisitor {
  constructor(options) {
    super(options);
    this.element = new EncodingElement();
  }
}
export default EncodingVisitor;