import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import OAuthFlowsElement from "../../../../elements/OAuthFlows.mjs";
const {
  visitors: {
    document: {
      objects: {
        OAuthFlows: {
          $visitor: BaseOAuthFlowsVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class OAuthFlowsVisitor extends BaseOAuthFlowsVisitor {
  constructor(options) {
    super(options);
    this.element = new OAuthFlowsElement();
  }
}
export default OAuthFlowsVisitor;