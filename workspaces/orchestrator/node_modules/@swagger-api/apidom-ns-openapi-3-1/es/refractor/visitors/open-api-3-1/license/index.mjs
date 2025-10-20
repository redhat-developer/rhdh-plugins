import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import LicenseElement from "../../../../elements/License.mjs";
const {
  visitors: {
    document: {
      objects: {
        License: {
          $visitor: BaseLicenseVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class LicenseVisitor extends BaseLicenseVisitor {
  constructor(options) {
    super(options);
    this.element = new LicenseElement();
  }
}
export default LicenseVisitor;