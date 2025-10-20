import { ObjectElement } from '@swagger-api/apidom-core';
class JmsOperationBinding extends ObjectElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'jmsOperationBinding';
    this.classes.push('operation-binding');
  }
}
export default JmsOperationBinding;