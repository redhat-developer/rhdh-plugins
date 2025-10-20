import type { IsPluginEnabled, ResolveConfig } from '../../types/config.js';
import type { LintStagedConfig } from './types.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    packageJsonPath: string;
    config: string[];
    resolveConfig: ResolveConfig<LintStagedConfig>;
};
export default _default;
