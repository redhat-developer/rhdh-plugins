import type { IsPluginEnabled } from '../../types/config.js';
declare const _default: {
    title: string;
    enablers: string[];
    isEnabled: IsPluginEnabled;
    args: {
        binaries: string[];
        positional: boolean;
        args: (args: string[]) => string[];
        config: boolean;
    };
};
export default _default;
