import { tsScriptBodies } from './compilers.js';
const condition = (hasDependency) => hasDependency('vue') || hasDependency('nuxt');
const compiler = tsScriptBodies;
export default { condition, compiler };
