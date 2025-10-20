import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import ContactElement from "../../../../elements/Contact.mjs";
const {
  visitors: {
    document: {
      objects: {
        Contact: {
          $visitor: BaseContactVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class ContactVisitor extends BaseContactVisitor {
  constructor(options) {
    super(options);
    this.element = new ContactElement();
  }
}
export default ContactVisitor;