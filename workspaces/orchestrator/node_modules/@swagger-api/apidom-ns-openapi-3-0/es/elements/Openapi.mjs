import { StringElement } from '@swagger-api/apidom-core';
class Openapi extends StringElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'openapi';
    this.classes.push('spec-version');
    this.classes.push('version');
  }
}
export default Openapi;