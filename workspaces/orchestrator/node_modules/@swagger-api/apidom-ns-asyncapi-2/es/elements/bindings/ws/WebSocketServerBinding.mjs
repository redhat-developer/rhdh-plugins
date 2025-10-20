import { ObjectElement } from '@swagger-api/apidom-core';
class WebSocketServerBinding extends ObjectElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'webSocketServerBinding';
    this.classes.push('server-binding');
  }
}
export default WebSocketServerBinding;