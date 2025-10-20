import { ArrayElement } from '@swagger-api/apidom-core';
class OperationServers extends ArrayElement {
  static primaryClass = 'operation-servers';
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.classes.push(OperationServers.primaryClass);
    this.classes.push('servers');
  }
}
export default OperationServers;