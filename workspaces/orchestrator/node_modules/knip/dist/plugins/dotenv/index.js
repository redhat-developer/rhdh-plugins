import { argsFrom } from '../../binaries/util.js';
const title = 'dotenv';
const args = {
    fromArgs: (parsed, args) => argsFrom(args, parsed._[0]),
};
export default {
    title,
    args,
};
