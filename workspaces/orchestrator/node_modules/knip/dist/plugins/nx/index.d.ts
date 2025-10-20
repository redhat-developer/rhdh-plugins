import type { ParsedArgs } from 'minimist';
import type { IsPluginEnabled, ResolveConfig } from '../../types/config.js';
import type { NxConfigRoot, NxProjectConfiguration } from './types.js';
declare const _default: {
    title: string;
    enablers: (string | RegExp)[];
    isEnabled: IsPluginEnabled;
    config: string[];
    resolveConfig: ResolveConfig<NxProjectConfiguration | NxConfigRoot>;
    args: {
        fromArgs: (parsed: ParsedArgs) => string[];
    };
};
export default _default;
