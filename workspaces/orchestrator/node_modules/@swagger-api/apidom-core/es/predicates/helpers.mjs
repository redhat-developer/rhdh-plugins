import { ArrayElement } from 'minim';
const hasMethod = (name, element) => {
  return typeof element === 'object' && element !== null && name in element && typeof element[name] === 'function';
};
const hasBasicElementProps = element => typeof element === 'object' && element != null && '_storedElement' in element && typeof element._storedElement === 'string' &&
// eslint-disable-line no-underscore-dangle
'_content' in element;
const primitiveEq = (val, element) => {
  if (typeof element === 'object' && element !== null && 'primitive' in element) {
    return typeof element.primitive === 'function' && element.primitive() === val;
  }
  return false;
};
const hasClass = (cls, element) => {
  return typeof element === 'object' && element !== null && 'classes' in element && (Array.isArray(element.classes) || element.classes instanceof ArrayElement) && element.classes.includes(cls);
};
export const isElementType = (name, element) => typeof element === 'object' && element !== null && 'element' in element && element.element === name;
const createPredicate = predicateCreator => {
  return predicateCreator({
    hasMethod,
    hasBasicElementProps,
    primitiveEq,
    isElementType,
    hasClass
  });
};
export default createPredicate;