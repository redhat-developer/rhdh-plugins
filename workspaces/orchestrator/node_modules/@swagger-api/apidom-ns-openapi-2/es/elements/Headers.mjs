import { ObjectElement } from '@swagger-api/apidom-core';
class Headers extends ObjectElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'headers';
  }
}
export default Headers;