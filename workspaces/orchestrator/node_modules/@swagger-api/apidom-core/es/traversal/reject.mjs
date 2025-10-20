import { complement } from 'ramda';
import filter from "./filter.mjs"; // complement of filter
const reject = (predicate, element) => {
  return filter(complement(predicate), element);
};
export default reject;