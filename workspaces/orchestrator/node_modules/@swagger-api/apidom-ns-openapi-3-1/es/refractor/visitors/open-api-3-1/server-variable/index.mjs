import { specificationObj as OpenApi3_1Specification } from '@swagger-api/apidom-ns-openapi-3-0';
import ServerVariableElement from "../../../../elements/ServerVariable.mjs";
const {
  visitors: {
    document: {
      objects: {
        ServerVariable: {
          $visitor: BaseServerVariableVisitor
        }
      }
    }
  }
} = OpenApi3_1Specification;
class ServerVariableVisitor extends BaseServerVariableVisitor {
  constructor(options) {
    super(options);
    this.element = new ServerVariableElement();
  }
}
export default ServerVariableVisitor;