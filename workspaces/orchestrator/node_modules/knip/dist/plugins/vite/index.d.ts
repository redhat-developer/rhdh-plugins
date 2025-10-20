import type { IsPluginEnabled } from '../../types/config.js';
export declare const config: string[];
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    config: string[];
    resolveEntryPaths: import("../../types/config.js").ResolveEntryPaths<import("../vitest/types.js").ViteConfigOrFn | import("../vitest/types.js").VitestWorkspaceConfig>;
    resolveConfig: import("../../types/config.js").ResolveConfig<import("../vitest/types.js").ViteConfigOrFn | import("../vitest/types.js").VitestWorkspaceConfig>;
};
export default _default;
