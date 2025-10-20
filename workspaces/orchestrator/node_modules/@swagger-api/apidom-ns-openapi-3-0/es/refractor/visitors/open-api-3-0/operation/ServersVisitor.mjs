import OperationServersElement from "../../../../elements/nces/OperationServers.mjs";
import BaseServersVisitor from "../ServersVisitor.mjs";
class ServersVisitor extends BaseServersVisitor {
  constructor(options) {
    super(options);
    this.element = new OperationServersElement();
  }
}
export default ServersVisitor;