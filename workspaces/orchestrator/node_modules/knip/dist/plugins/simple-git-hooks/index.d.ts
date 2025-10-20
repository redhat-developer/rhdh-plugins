import type { IsPluginEnabled, ResolveConfig } from '../../types/config.js';
import type { SimpleGitHooksConfig } from './types.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    resolveConfig: ResolveConfig<SimpleGitHooksConfig>;
};
export default _default;
