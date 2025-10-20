import type { IsPluginEnabled, ResolveConfig } from '../../types/config.js';
import type { NpmPkgJsonLintConfig } from './types.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    packageJsonPath: string;
    config: string[];
    resolveConfig: ResolveConfig<NpmPkgJsonLintConfig>;
};
export default _default;
