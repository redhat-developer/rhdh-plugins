import { ArrayElement } from '@swagger-api/apidom-core';
class ServerSecurity extends ArrayElement {
  static primaryClass = 'server-security';
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.classes.push(ServerSecurity.primaryClass);
  }
}
export default ServerSecurity;