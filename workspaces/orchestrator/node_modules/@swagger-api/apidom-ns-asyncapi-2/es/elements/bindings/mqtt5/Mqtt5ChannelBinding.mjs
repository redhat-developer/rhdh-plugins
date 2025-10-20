import { ObjectElement } from '@swagger-api/apidom-core';
class Mqtt5ChannelBinding extends ObjectElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'mqtt5ChannelBinding';
    this.classes.push('channel-binding');
  }
}
export default Mqtt5ChannelBinding;