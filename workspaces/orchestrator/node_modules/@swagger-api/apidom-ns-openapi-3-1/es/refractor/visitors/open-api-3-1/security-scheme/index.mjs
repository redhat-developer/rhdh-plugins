import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import SecuritySchemeElement from "../../../../elements/SecurityScheme.mjs";
const {
  visitors: {
    document: {
      objects: {
        SecurityScheme: {
          $visitor: BaseSecuritySchemeVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class SecuritySchemeVisitor extends BaseSecuritySchemeVisitor {
  constructor(options) {
    super(options);
    this.element = new SecuritySchemeElement();
  }
}
export default SecuritySchemeVisitor;