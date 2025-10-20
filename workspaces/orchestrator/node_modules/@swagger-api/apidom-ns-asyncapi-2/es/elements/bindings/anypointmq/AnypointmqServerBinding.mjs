import { ObjectElement } from '@swagger-api/apidom-core';
class AnypointmqServerBinding extends ObjectElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'anypointmqServerBinding';
    this.classes.push('server-binding');
  }
}
export default AnypointmqServerBinding;