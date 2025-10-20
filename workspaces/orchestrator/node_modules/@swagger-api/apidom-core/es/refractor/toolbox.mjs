import * as basePredicates from "../predicates/index.mjs";
import defaultNamespaceInstance from "../namespace.mjs";
const createToolbox = () => {
  const predicates = {
    ...basePredicates
  };
  return {
    predicates,
    namespace: defaultNamespaceInstance
  };
};
export default createToolbox;