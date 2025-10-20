import { argsFrom } from '../../binaries/util.js';
const title = 'c8';
const args = {
    args: (args) => args.filter(arg => arg !== 'check-coverage'),
    boolean: ['all', 'check-coverage', 'clean', 'exclude-after-remap', 'per-file', 'skip-full'],
    fromArgs: (parsed, args) => argsFrom(args, parsed._[0]),
};
export default {
    title,
    args,
};
