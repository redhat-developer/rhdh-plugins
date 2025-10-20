import JsonNode from "./JsonNode.mjs";
import { isProperty } from "./predicates.mjs";
class JsonObject extends JsonNode {
  static type = 'object';
  get properties() {
    return this.children.filter(isProperty);
  }
}
export default JsonObject;