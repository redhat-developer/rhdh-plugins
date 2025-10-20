import { ObjectElement } from '@swagger-api/apidom-core';
class AnypointmqOperationBinding extends ObjectElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'anypointmqOperationBinding';
    this.classes.push('operation-binding');
  }
}
export default AnypointmqOperationBinding;