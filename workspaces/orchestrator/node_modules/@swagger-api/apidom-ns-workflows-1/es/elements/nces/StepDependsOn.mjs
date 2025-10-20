import { ArrayElement } from '@swagger-api/apidom-core';
class StepDependsOn extends ArrayElement {
  static primaryClass = 'step-depends-on';
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.classes.push(StepDependsOn.primaryClass);
  }
}
export default StepDependsOn;