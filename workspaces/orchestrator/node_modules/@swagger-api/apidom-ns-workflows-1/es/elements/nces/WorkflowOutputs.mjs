import { ObjectElement } from '@swagger-api/apidom-core';
class WorkflowOutputs extends ObjectElement {
  static primaryClass = 'workflow-outputs';
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.classes.push(WorkflowOutputs.primaryClass);
  }
}
export default WorkflowOutputs;