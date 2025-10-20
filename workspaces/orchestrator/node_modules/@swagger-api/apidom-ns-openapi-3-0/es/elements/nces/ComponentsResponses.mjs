import { ObjectElement } from '@swagger-api/apidom-core';
class ComponentsResponses extends ObjectElement {
  static primaryClass = 'components-responses';
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.classes.push(ComponentsResponses.primaryClass);
  }
}
export default ComponentsResponses;