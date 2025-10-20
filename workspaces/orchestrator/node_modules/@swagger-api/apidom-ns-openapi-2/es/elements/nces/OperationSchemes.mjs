import { ArrayElement } from '@swagger-api/apidom-core';
class OperationSchemes extends ArrayElement {
  static primaryClass = 'operation-schemes';
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.classes.push(OperationSchemes.primaryClass);
  }
}
export default OperationSchemes;