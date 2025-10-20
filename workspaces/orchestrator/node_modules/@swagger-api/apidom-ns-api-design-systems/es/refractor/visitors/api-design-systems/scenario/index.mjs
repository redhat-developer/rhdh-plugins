import { always } from 'ramda';
import { Mixin } from 'ts-mixer';
import ScenarioElement from "../../../../elements/Scenario.mjs";
import FallbackVisitor from "../../FallbackVisitor.mjs";
import FixedFieldsVisitor from "../../generics/FixedFieldsVisitor.mjs";
class ScenarioVisitor extends Mixin(FixedFieldsVisitor, FallbackVisitor) {
  constructor(options) {
    super(options);
    this.element = new ScenarioElement();
    this.specPath = always(['document', 'objects', 'Scenario']);
  }
}
export default ScenarioVisitor;