import type binding from "@rspack/binding";
import type { ResolveCallback } from "./config/adapterRuleUse";
type ResolveContext = {};
export type ResourceData = binding.JsResourceData;
export interface ResolveRequest {
    path: string;
    query: string;
    fragment: string;
    descriptionFileData?: string;
    descriptionFilePath?: string;
}
export declare class Resolver {
    #private;
    constructor(binding: binding.JsResolver);
    resolveSync(context: object, path: string, request: string): string | false;
    resolve(context: object, path: string, request: string, resolveContext: ResolveContext, callback: ResolveCallback): void;
}
export {};
