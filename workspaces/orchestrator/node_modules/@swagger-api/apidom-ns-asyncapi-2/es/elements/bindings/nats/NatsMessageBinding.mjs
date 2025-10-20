import { ObjectElement } from '@swagger-api/apidom-core';
class NatsMessageBinding extends ObjectElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'natsMessageBinding';
    this.classes.push('message-binding');
  }
}
export default NatsMessageBinding;