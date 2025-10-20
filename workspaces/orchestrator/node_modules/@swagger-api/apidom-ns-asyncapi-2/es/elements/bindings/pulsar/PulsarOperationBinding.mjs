import { ObjectElement } from '@swagger-api/apidom-core';
class PulsarOperationBinding extends ObjectElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'pulsarOperationBinding';
    this.classes.push('operation-binding');
  }
}
export default PulsarOperationBinding;