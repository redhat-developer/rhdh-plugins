import { T as stubTrue } from 'ramda';
import { isJSONReferenceLikeElement } from "../../predicates.mjs";
import AlternatingVisitor from "../generics/AlternatingVisitor.mjs";
class SchemaOrReferenceVisitor extends AlternatingVisitor {
  constructor(options) {
    super(options);
    this.alternator = [{
      predicate: isJSONReferenceLikeElement,
      specPath: ['document', 'objects', 'JSONReference']
    }, {
      predicate: stubTrue,
      specPath: ['document', 'objects', 'JSONSchema']
    }];
  }
}
export default SchemaOrReferenceVisitor;