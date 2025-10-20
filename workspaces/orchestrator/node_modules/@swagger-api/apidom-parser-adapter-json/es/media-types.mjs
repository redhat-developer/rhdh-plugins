import { MediaTypes } from '@swagger-api/apidom-core';
export class JSONMediaTypes extends MediaTypes {
  latest() {
    return this[0];
  }
}
const mediaTypes = new JSONMediaTypes('application/json');
export default mediaTypes;