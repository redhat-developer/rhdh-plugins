import type { Compiler } from "../Compiler";
import type { ModuleFederationPluginV1Options } from "./ModuleFederationPluginV1";
export interface ModuleFederationPluginOptions extends Omit<ModuleFederationPluginV1Options, "enhanced"> {
    runtimePlugins?: RuntimePlugins;
    implementation?: string;
    shareStrategy?: "version-first" | "loaded-first";
}
export type RuntimePlugins = string[];
export declare class ModuleFederationPlugin {
    private _options;
    constructor(_options: ModuleFederationPluginOptions);
    apply(compiler: Compiler): void;
}
