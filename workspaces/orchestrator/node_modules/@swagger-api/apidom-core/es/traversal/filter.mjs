import { ArraySlice } from 'minim';
import { PredicateVisitor, visit } from "./visitor.mjs"; // finds all elements matching the predicate
const filter = (predicate, element) => {
  const visitor = new PredicateVisitor({
    predicate
  });
  visit(element, visitor);
  return new ArraySlice(visitor.result);
};
export default filter;