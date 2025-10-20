import { ArrayElement } from '@swagger-api/apidom-core';
class Tags extends ArrayElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'tags';
  }
}
export default Tags;