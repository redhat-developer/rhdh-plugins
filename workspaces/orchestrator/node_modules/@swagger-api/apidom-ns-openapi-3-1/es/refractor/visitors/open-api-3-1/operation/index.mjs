import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import OperationElement from "../../../../elements/Operation.mjs";
const {
  visitors: {
    document: {
      objects: {
        Operation: {
          $visitor: BaseOperationVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class OperationVisitor extends BaseOperationVisitor {
  constructor(options) {
    super(options);
    this.element = new OperationElement();
  }
}
export default OperationVisitor;