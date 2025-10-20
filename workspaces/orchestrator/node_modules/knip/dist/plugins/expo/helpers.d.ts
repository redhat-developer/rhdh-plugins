import type { PluginOptions, ResolveConfig } from '../../types/config.js';
import type { ExpoConfig } from './types.js';
export declare const getConfig: (localConfig: ExpoConfig, options: PluginOptions) => {
    platforms?: ("ios" | "android" | "web")[];
    notification?: Record<string, unknown>;
    updates?: {
        enabled?: boolean;
    };
    backgroundColor?: string;
    userInterfaceStyle?: "automatic" | "light" | "dark";
    ios?: {
        backgroundColor?: string;
    };
    android?: {
        userInterfaceStyle?: "automatic" | "light" | "dark";
    };
    androidNavigationBar?: Record<string, unknown>;
    plugins?: (string | [string, Record<string, unknown>])[];
};
export declare const getDependencies: ResolveConfig<ExpoConfig>;
