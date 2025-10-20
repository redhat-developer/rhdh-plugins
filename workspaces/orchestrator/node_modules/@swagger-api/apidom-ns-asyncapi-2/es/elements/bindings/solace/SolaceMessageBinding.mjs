import { ObjectElement } from '@swagger-api/apidom-core';
class SolaceMessageBinding extends ObjectElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'solaceMessageBinding';
    this.classes.push('message-binding');
  }
}
export default SolaceMessageBinding;