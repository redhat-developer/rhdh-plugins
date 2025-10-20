import { isObjectElement } from '@swagger-api/apidom-core';
// eslint-disable-next-line import/prefer-default-export
export const isJSONReferenceLikeElement = element => {
  return isObjectElement(element) && element.hasKey('$ref');
};