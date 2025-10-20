import { ObjectElement } from '@swagger-api/apidom-core';
class SecurityRequirement extends ObjectElement {
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.element = 'securityRequirement';
  }
}
export default SecurityRequirement;