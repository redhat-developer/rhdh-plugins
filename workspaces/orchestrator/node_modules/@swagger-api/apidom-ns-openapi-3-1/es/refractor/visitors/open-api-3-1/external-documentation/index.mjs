import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import ExternalDocumentationElement from "../../../../elements/ExternalDocumentation.mjs";
const {
  visitors: {
    document: {
      objects: {
        ExternalDocumentation: {
          $visitor: BaseExternalDocumentationVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class ExternalDocumentationVisitor extends BaseExternalDocumentationVisitor {
  constructor(options) {
    super(options);
    this.element = new ExternalDocumentationElement();
  }
}
export default ExternalDocumentationVisitor;