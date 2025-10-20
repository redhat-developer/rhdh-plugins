import { Mixin } from 'ts-mixer';
import { always } from 'ramda';
import SnsMessageBindingElement from "../../../../../../elements/bindings/sns/SnsMessageBinding.mjs";
import FixedFieldsVisitor from "../../../../generics/FixedFieldsVisitor.mjs";
import FallbackVisitor from "../../../../FallbackVisitor.mjs";
class SnsMessageBindingVisitor extends Mixin(FixedFieldsVisitor, FallbackVisitor) {
  constructor(options) {
    super(options);
    this.element = new SnsMessageBindingElement();
    this.specPath = always(['document', 'objects', 'bindings', 'sns', 'MessageBinding']);
    this.canSupportSpecificationExtensions = false;
  }
}
export default SnsMessageBindingVisitor;