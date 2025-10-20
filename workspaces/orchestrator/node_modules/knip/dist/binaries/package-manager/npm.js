import parseArgs from 'minimist';
export const resolve = (_binary, args, options) => {
    const { fromArgs } = options;
    const parsed = parseArgs(args);
    const [command] = parsed._;
    return command !== 'exec' ? [] : fromArgs(parsed._.slice(1));
};
