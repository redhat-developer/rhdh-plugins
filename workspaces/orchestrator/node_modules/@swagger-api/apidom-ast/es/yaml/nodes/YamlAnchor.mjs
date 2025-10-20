import Node from "../../Node.mjs";
class YamlAnchor extends Node {
  static type = 'anchor';
  name;
  constructor({
    name,
    ...rest
  }) {
    super({
      ...rest
    });
    this.name = name;
  }
}
export default YamlAnchor;