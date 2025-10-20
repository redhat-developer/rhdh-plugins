import parseArgs from 'minimist';
import { compact } from '../util/array.js';
import { toBinary, toDeferResolve, toEntry } from '../util/input.js';
const spawningBinaries = ['cross-env', 'retry-cli'];
const endOfCommandBinaries = ['dotenvx'];
const positionals = new Set(['babel-node', 'esbuild', 'execa', 'vite-node', 'zx']);
export const resolve = (binary, args, { fromArgs }) => {
    const parsed = parseArgs(args, { boolean: ['quiet', 'verbose'], '--': endOfCommandBinaries.includes(binary) });
    const bin = binary.startsWith('.') ? toEntry(binary) : toBinary(binary);
    const shiftedArgs = spawningBinaries.includes(binary) ? fromArgs(args) : [];
    const pos = positionals.has(binary) ? [toDeferResolve(parsed._[0])] : [];
    const newCommand = parsed['--'] && parsed['--'].length > 0 ? fromArgs(parsed['--']) : [];
    return compact([bin, ...shiftedArgs, ...pos, ...newCommand]);
};
