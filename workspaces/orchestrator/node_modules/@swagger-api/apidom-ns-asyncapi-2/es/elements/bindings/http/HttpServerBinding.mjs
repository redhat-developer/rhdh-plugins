import { ObjectElement } from '@swagger-api/apidom-core';
class HttpServerBinding extends ObjectElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'httpServerBinding';
    this.classes.push('server-binding');
  }
}
export default HttpServerBinding;