import { ArrayElement } from '@swagger-api/apidom-core';
class StandardIdentifier extends ArrayElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'standardIdentifier';
  }
}
export default StandardIdentifier;