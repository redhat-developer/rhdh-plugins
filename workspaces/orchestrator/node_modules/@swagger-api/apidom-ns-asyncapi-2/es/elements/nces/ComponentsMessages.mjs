import { ObjectElement } from '@swagger-api/apidom-core';
class ComponentsMessages extends ObjectElement {
  static primaryClass = 'components-messages';
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.classes.push(ComponentsMessages.primaryClass);
  }
}
export default ComponentsMessages;