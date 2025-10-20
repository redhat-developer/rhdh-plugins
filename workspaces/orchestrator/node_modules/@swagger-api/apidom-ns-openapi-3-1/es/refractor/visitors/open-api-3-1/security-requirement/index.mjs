import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import SecurityRequirementElement from "../../../../elements/SecurityRequirement.mjs";
const {
  visitors: {
    document: {
      objects: {
        SecurityRequirement: {
          $visitor: BaseSecurityRequirementVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class SecurityRequirementVisitor extends BaseSecurityRequirementVisitor {
  constructor(options) {
    super(options);
    this.element = new SecurityRequirementElement();
  }
}
export default SecurityRequirementVisitor;