import FallbackVisitor from "../FallbackVisitor.mjs";
class HostVisitor extends FallbackVisitor {
  StringElement(stringElement) {
    const result = super.enter(stringElement);
    this.element.classes.push('swagger-host');
    return result;
  }
}
export default HostVisitor;