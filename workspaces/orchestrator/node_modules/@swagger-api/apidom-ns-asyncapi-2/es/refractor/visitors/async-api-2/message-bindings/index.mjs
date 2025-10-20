import { Mixin } from 'ts-mixer';
import { always } from 'ramda';
import MessageBindingsElement from "../../../../elements/MessageBindings.mjs";
import FixedFieldsVisitor from "../../generics/FixedFieldsVisitor.mjs";
import FallbackVisitor from "../../FallbackVisitor.mjs";
class MessageBindingsVisitor extends Mixin(FixedFieldsVisitor, FallbackVisitor) {
  constructor(options) {
    super(options);
    this.element = new MessageBindingsElement();
    this.specPath = always(['document', 'objects', 'MessageBindings']);
    this.canSupportSpecificationExtensions = true;
  }
}
export default MessageBindingsVisitor;