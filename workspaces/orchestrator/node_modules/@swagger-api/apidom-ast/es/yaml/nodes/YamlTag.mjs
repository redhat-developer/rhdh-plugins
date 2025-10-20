import Node from "../../Node.mjs";
export let YamlNodeKind = /*#__PURE__*/function (YamlNodeKind) {
  YamlNodeKind["Scalar"] = "Scalar";
  YamlNodeKind["Sequence"] = "Sequence";
  YamlNodeKind["Mapping"] = "Mapping";
  return YamlNodeKind;
}({});
class YamlTag extends Node {
  static type = 'tag';
  explicitName;
  kind;
  constructor({
    explicitName,
    kind,
    ...rest
  }) {
    super({
      ...rest
    });
    this.explicitName = explicitName;
    this.kind = kind;
  }
}
export default YamlTag;