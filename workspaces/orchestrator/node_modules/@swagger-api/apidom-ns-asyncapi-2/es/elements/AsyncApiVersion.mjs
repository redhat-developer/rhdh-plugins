import { StringElement } from '@swagger-api/apidom-core';
class AsyncApiVersion extends StringElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'asyncApiVersion';
    this.classes.push('spec-version');
    this.classes.push('version');
  }
}
export default AsyncApiVersion;