import OperationParametersElement from "../../../../elements/nces/OperationParameters.mjs";
import BaseParametersVisitor from "../ParametersVisitor.mjs";
class ParametersVisitor extends BaseParametersVisitor {
  constructor(options) {
    super(options);
    this.element = new OperationParametersElement();
  }
}
export default ParametersVisitor;