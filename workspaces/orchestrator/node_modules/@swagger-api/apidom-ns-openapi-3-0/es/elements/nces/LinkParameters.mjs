import { ObjectElement } from '@swagger-api/apidom-core';
class LinkParameters extends ObjectElement {
  static primaryClass = 'link-parameters';
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.classes.push(LinkParameters.primaryClass);
  }
}
export default LinkParameters;