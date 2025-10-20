import JsonPointerError from "./JsonPointerError.mjs";
class CompilationJsonPointerError extends JsonPointerError {
  tokens;
  constructor(message, structuredOptions) {
    super(message, structuredOptions);
    if (typeof structuredOptions !== 'undefined') {
      this.tokens = [...structuredOptions.tokens];
    }
  }
}
export default CompilationJsonPointerError;