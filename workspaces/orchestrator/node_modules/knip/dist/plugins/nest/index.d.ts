import type { IsPluginEnabled, ResolveConfig } from '../../types/config.js';
import type { NestConfig } from './types.js';
declare const _default: {
    title: string;
    enablers: RegExp[];
    isEnabled: IsPluginEnabled;
    config: string[];
    resolveConfig: ResolveConfig<NestConfig>;
};
export default _default;
