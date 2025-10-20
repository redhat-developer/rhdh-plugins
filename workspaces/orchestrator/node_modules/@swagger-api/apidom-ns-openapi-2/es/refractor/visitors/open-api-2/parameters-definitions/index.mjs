import { Mixin } from 'ts-mixer';
import { always } from 'ramda';
import ParametersDefinitionsElement from "../../../../elements/ParametersDefinitions.mjs";
import MapVisitor from "../../generics/MapVisitor.mjs";
import FallbackVisitor from "../../FallbackVisitor.mjs";
class ParametersDefinitionsVisitor extends Mixin(MapVisitor, FallbackVisitor) {
  constructor(options) {
    super(options);
    this.element = new ParametersDefinitionsElement();
    this.specPath = always(['document', 'objects', 'Parameter']);
  }
}
export default ParametersDefinitionsVisitor;