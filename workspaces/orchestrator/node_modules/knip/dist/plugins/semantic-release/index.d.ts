import type { IsPluginEnabled, ResolveConfig } from '../../types/config.js';
import type { SemanticReleaseConfig } from './types.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    isRootOnly: true;
    packageJsonPath: string;
    config: string[];
    resolveConfig: ResolveConfig<SemanticReleaseConfig>;
};
export default _default;
