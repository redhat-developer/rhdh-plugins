import PathItemParametersElement from "../../../../elements/nces/PathItemParameters.mjs";
import BaseParametersVisitor from "../ParametersVisitor.mjs";
class ParametersVisitor extends BaseParametersVisitor {
  constructor(options) {
    super(options);
    this.element = new PathItemParametersElement();
  }
}
export default ParametersVisitor;