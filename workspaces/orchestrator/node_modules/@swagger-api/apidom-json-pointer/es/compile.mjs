import escape from "./escape.mjs";
import CompilationJsonPointerError from "./errors/CompilationJsonPointerError.mjs"; // compile :: String[] -> String
const compile = tokens => {
  try {
    if (tokens.length === 0) {
      return '';
    }
    return `/${tokens.map(escape).join('/')}`;
  } catch (error) {
    throw new CompilationJsonPointerError('JSON Pointer compilation of tokens encountered an error.', {
      tokens,
      cause: error
    });
  }
};
export default compile;