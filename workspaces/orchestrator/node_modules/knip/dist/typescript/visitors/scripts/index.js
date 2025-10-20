import bun from './bun.js';
import execa from './execa.js';
import zx from './zx.js';
const visitors = [bun, execa, zx];
export default (sourceFile) => visitors.map(v => v(sourceFile));
