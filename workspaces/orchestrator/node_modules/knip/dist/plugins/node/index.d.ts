import type { IsPluginEnabled, ResolveEntryPaths } from '../../types/config.js';
import type { PackageJson } from '../../types/package-json.js';
declare const _default: {
    title: string;
    isEnabled: IsPluginEnabled;
    packageJsonPath: (id: PackageJson) => PackageJson;
    config: string[];
    resolveEntryPaths: ResolveEntryPaths<PackageJson>;
    args: {
        positional: boolean;
        nodeImportArgs: boolean;
        resolve: string[];
        args: (args: string[]) => string[];
    };
};
export default _default;
