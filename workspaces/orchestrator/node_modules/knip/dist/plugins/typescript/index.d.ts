import type { TsConfigJson } from 'type-fest';
import type { IsPluginEnabled, ResolveConfig } from '../../types/config.js';
export declare const docs: {
    note: string;
};
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    resolveConfig: ResolveConfig<TsConfigJson>;
    args: {
        binaries: string[];
        string: string[];
        alias: {
            project: string[];
        };
        config: [string, (p: string) => string][];
    };
};
export default _default;
