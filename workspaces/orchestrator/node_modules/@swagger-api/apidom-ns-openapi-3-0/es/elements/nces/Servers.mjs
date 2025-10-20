import { ArrayElement } from '@swagger-api/apidom-core';
class Servers extends ArrayElement {
  static primaryClass = 'servers';
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.classes.push(Servers.primaryClass);
  }
}
export default Servers;