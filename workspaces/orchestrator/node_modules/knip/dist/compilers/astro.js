import { fencedCodeBlockMatcher, importMatcher } from './compilers.js';
const condition = (hasDependency) => hasDependency('astro');
const compiler = (text) => [...text.replace(fencedCodeBlockMatcher, '').matchAll(importMatcher)].join('\n');
export default { condition, compiler };
