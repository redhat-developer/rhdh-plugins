import type { ParsedArgs } from 'minimist';
declare const _default: {
    title: string;
    args: {
        args: (args: string[]) => string[];
        boolean: string[];
        fromArgs: (parsed: ParsedArgs, args: string[]) => string[];
    };
};
export default _default;
