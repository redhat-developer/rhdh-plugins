import { importsWithinScripts } from './compilers.js';
const condition = (hasDependency) => hasDependency('svelte');
const compiler = importsWithinScripts;
export default { condition, compiler };
