import { ObjectElement } from '@swagger-api/apidom-core';
class Parameters extends ObjectElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'parameters';
  }
}
export default Parameters;