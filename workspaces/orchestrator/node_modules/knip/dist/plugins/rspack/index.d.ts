import type { IsPluginEnabled, ResolveConfig } from '../../types/config.js';
import type { WebpackConfig } from '../webpack/types.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    resolveConfig: ResolveConfig<WebpackConfig>;
};
export default _default;
