import type { IsPluginEnabled, ResolveConfig } from '../../types/config.js';
import { type Input } from '../../util/input.js';
import type { WebpackConfig } from './types.js';
export declare const findWebpackDependenciesFromConfig: ({ config, cwd }: {
    config: WebpackConfig;
    cwd: string;
}) => Promise<Set<Input>>;
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    resolveConfig: ResolveConfig<WebpackConfig>;
    args: {
        binaries: string[];
        config: boolean;
    };
};
export default _default;
