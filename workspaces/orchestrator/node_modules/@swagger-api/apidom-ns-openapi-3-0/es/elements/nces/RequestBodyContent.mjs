import { ObjectElement } from '@swagger-api/apidom-core';
class RequestBodyContent extends ObjectElement {
  static primaryClass = 'request-body-content';
  constructor(content, meta, attributes) {
    super(content, meta, attributes);
    this.classes.push(RequestBodyContent.primaryClass);
    this.classes.push('content');
  }
}
export default RequestBodyContent;