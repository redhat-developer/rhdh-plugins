import { ObjectElement } from '@swagger-api/apidom-core';
class SolaceChannelBinding extends ObjectElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'solaceChannelBinding';
    this.classes.push('channel-binding');
  }
}
export default SolaceChannelBinding;