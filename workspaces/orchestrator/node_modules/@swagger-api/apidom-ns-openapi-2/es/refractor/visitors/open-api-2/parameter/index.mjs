import { Mixin } from 'ts-mixer';
import { always } from 'ramda';
import ParameterElement from "../../../../elements/Parameter.mjs";
import FixedFieldsVisitor from "../../generics/FixedFieldsVisitor.mjs";
import FallbackVisitor from "../../FallbackVisitor.mjs";
class ParameterVisitor extends Mixin(FixedFieldsVisitor, FallbackVisitor) {
  constructor(options) {
    super(options);
    this.element = new ParameterElement();
    this.specPath = always(['document', 'objects', 'Parameter']);
    this.canSupportSpecificationExtensions = true;
  }
}
export default ParameterVisitor;