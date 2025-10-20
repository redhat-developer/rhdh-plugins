import FallbackVisitor from "../FallbackVisitor.mjs";
class BasePathVisitor extends FallbackVisitor {
  StringElement(stringElement) {
    const result = super.enter(stringElement);
    this.element.classes.push('swagger-base-path');
    return result;
  }
}
export default BasePathVisitor;