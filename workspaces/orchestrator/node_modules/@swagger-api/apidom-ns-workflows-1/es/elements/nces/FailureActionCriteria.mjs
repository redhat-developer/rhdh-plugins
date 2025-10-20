import { ArrayElement } from '@swagger-api/apidom-core';
class FailureActionCriteria extends ArrayElement {
  static primaryClass = 'failure-action-criteria';
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.classes.push(FailureActionCriteria.primaryClass);
    this.classes.push('criteria');
  }
}
export default FailureActionCriteria;