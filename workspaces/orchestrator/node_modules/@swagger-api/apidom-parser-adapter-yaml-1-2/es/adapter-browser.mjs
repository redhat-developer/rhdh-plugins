import lexicalAnalysis from "./lexical-analysis/browser.mjs";
import syntacticAnalysis from "./syntactic-analysis/indirect/index.mjs";
export { mediaTypes, namespace } from "./adapter.mjs";
export { lexicalAnalysis, syntacticAnalysis };
export const detect = async source => {
  try {
    const cst = await lexicalAnalysis(source);
    return cst.rootNode.type !== 'ERROR';
  } catch {
    return false;
  }
};
export const parse = async (source, {
  sourceMap = false
} = {}) => {
  const cst = await lexicalAnalysis(source);
  return syntacticAnalysis(cst, {
    sourceMap
  });
};