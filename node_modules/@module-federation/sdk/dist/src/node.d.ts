import { CreateScriptHookNode } from './types';
export declare function createScriptNode(url: string, cb: (error?: Error, scriptContext?: any) => void, attrs?: Record<string, any>, createScriptHook?: CreateScriptHookNode): void;
export declare function loadScriptNode(url: string, info: {
    attrs?: Record<string, any>;
    createScriptHook?: CreateScriptHookNode;
}): Promise<void>;
