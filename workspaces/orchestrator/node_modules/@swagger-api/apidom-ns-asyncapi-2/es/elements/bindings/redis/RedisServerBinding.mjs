import { ObjectElement } from '@swagger-api/apidom-core';
class RedisServerBinding extends ObjectElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'redisServerBinding';
    this.classes.push('server-binding');
  }
}
export default RedisServerBinding;