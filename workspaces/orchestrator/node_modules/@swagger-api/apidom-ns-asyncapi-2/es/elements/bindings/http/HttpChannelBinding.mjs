import { ObjectElement } from '@swagger-api/apidom-core';
class HttpChannelBinding extends ObjectElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'httpChannelBinding';
    this.classes.push('channel-binding');
  }
}
export default HttpChannelBinding;