import { startsWith } from 'ramda';
import { isStringElement, isObjectElement, toValue } from '@swagger-api/apidom-core';
export const isReferenceLikeElement = element => {
  return isObjectElement(element) && element.hasKey('$ref');
};
export const isServerLikeElement = isObjectElement;
export const isTagLikeElement = isObjectElement;
export const isOpenApiExtension = element => {
  // @ts-ignore
  return isStringElement(element.key) && startsWith('x-', toValue(element.key));
};