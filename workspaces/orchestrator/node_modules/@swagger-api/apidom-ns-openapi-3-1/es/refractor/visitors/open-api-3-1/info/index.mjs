import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import InfoElement from "../../../../elements/Info.mjs";
const {
  visitors: {
    document: {
      objects: {
        Info: {
          $visitor: BaseInfoVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class InfoVisitor extends BaseInfoVisitor {
  constructor(options) {
    super(options);
    this.element = new InfoElement();
  }
}
export default InfoVisitor;