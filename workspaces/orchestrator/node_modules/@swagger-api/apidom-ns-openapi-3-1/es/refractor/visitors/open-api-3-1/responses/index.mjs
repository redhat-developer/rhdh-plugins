import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import ResponsesElement from "../../../../elements/Responses.mjs";
const {
  visitors: {
    document: {
      objects: {
        Responses: {
          $visitor: BaseResponsesVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class ResponsesVisitor extends BaseResponsesVisitor {
  constructor(options) {
    super(options);
    this.element = new ResponsesElement();
  }
}
export default ResponsesVisitor;