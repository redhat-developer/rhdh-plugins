import type { CompilerOptions } from 'typescript';
import type { ConfigurationChief, Workspace } from '../ConfigurationChief.js';
export declare const augmentWorkspace: (workspace: Workspace, dir: string, compilerOptions: CompilerOptions) => void;
export declare const getToSourcePathHandler: (chief: ConfigurationChief) => (filePath: string) => string | undefined;
export type ToSourceFilePath = ReturnType<typeof getToSourcePathHandler>;
