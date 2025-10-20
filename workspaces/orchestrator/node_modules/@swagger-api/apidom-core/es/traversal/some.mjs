import { isNotUndefined } from 'ramda-adjunct';
import find from "./find.mjs"; // tests whether at least one element passes the predicate
const some = (predicate, element) => {
  return isNotUndefined(find(predicate, element));
};
export default some;