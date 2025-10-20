import { head } from 'ramda';
import JsonNode from "./JsonNode.mjs";
class JsonDocument extends JsonNode {
  static type = 'document';
  get child() {
    return head(this.children);
  }
}
export default JsonDocument;