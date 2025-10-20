import { ArrayElement } from '@swagger-api/apidom-core';
class Security extends ArrayElement {
  static primaryClass = 'security';
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.classes.push(Security.primaryClass);
  }
}
export default Security;