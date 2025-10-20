import type { IsPluginEnabled, ResolveConfig } from '../../types/config.js';
import type { TsupConfig } from './types.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    resolveConfig: ResolveConfig<TsupConfig>;
    args: {
        config: boolean;
    };
};
export default _default;
