import { Namespace as MinimNamespace } from 'minim';
import { isPlainObject } from 'ramda-adjunct';
import AnnotationElement from "./elements/Annotation.mjs";
import CommentElement from "./elements/Comment.mjs";
import ParseResultElement from "./elements/ParseResult.mjs";
import SourceMapElement from "./elements/SourceMap.mjs";
export class Namespace extends MinimNamespace {
  constructor() {
    super();
    this.register('annotation', AnnotationElement);
    this.register('comment', CommentElement);
    this.register('parseResult', ParseResultElement);
    this.register('sourceMap', SourceMapElement);
  }
}
const namespace = new Namespace();
export const createNamespace = namespacePlugin => {
  const namespaceInstance = new Namespace();
  if (isPlainObject(namespacePlugin)) {
    namespaceInstance.use(namespacePlugin);
  }
  return namespaceInstance;
};
export default namespace;