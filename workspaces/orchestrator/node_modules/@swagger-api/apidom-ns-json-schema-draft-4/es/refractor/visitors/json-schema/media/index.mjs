import { Mixin } from 'ts-mixer';
import { always } from 'ramda';
import MediaElement from "../../../../elements/Media.mjs";
import FixedFieldsVisitor from "../../generics/FixedFieldsVisitor.mjs";
import FallbackVisitor from "../../FallbackVisitor.mjs";
class MediaVisitor extends Mixin(FixedFieldsVisitor, FallbackVisitor) {
  constructor(options) {
    super(options);
    this.element = new MediaElement();
    this.specPath = always(['document', 'objects', 'Media']);
  }
}
export default MediaVisitor;