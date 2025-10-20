import type { IsPluginEnabled, ResolveConfig } from '../../types/config.js';
import type { GraphqlCodegenTypes, GraphqlConfigTypes, GraphqlProjectsConfigTypes } from './types.js';
declare const _default: {
    title: string;
    enablers: (string | RegExp)[];
    isEnabled: IsPluginEnabled;
    packageJsonPath: (manifest: import("../../types/package-json.js").PackageJson) => unknown;
    config: string[];
    resolveConfig: ResolveConfig<GraphqlCodegenTypes | GraphqlConfigTypes | GraphqlProjectsConfigTypes>;
};
export default _default;
