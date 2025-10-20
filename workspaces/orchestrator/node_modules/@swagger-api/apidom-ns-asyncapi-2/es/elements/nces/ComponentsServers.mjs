import { ObjectElement } from '@swagger-api/apidom-core';
class ComponentsServers extends ObjectElement {
  static primaryClass = 'components-servers';
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.classes.push(ComponentsServers.primaryClass);
  }
}
export default ComponentsServers;