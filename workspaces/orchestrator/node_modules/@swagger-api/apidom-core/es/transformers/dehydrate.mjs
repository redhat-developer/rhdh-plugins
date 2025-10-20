import defaultNamespaceInstance from "../namespace.mjs";
/**
 * Creates a refract representation of an Element.
 * https://github.com/refractproject/refract-spec
 */
const dehydrate = (element, namespace = defaultNamespaceInstance) => {
  return namespace.toRefract(element);
};
export default dehydrate;