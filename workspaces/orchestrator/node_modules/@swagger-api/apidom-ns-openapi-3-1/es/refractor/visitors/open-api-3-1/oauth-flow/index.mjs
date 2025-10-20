import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import OAuthFlowElement from "../../../../elements/OAuthFlow.mjs";
const {
  visitors: {
    document: {
      objects: {
        OAuthFlow: {
          $visitor: BaseOAuthFlowVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class OAuthFlowVisitor extends BaseOAuthFlowVisitor {
  constructor(options) {
    super(options);
    this.element = new OAuthFlowElement();
  }
}
export default OAuthFlowVisitor;