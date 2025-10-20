import type { IsPluginEnabled, ResolveConfig } from '../../types/config.js';
import type { TypeDocConfig } from './types.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    packageJsonPath: string;
    config: string[];
    resolveConfig: ResolveConfig<TypeDocConfig | {
        typedocOptions: TypeDocConfig;
    }>;
    args: {
        resolve: string[];
    };
};
export default _default;
