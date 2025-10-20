import ts from 'typescript';
import type { AsyncCompilers, SyncCompilers } from '../compilers/types.js';
import type { ToSourceFilePath } from '../util/to-source-path.js';
import { SourceFileManager } from './SourceFileManager.js';
type CreateHostsOptions = {
    cwd: string;
    compilerOptions: ts.CompilerOptions;
    entryPaths: Set<string>;
    compilers: [SyncCompilers, AsyncCompilers];
    isSkipLibs: boolean;
    toSourceFilePath: ToSourceFilePath;
    useResolverCache: boolean;
};
export declare const createHosts: ({ cwd, compilerOptions, entryPaths, compilers, isSkipLibs, toSourceFilePath, useResolverCache, }: CreateHostsOptions) => {
    fileManager: SourceFileManager;
    compilerHost: ts.CompilerHost;
    resolveModuleNames: (moduleNames: string[], containingFile: string) => Array<ts.ResolvedModuleFull | undefined>;
    languageServiceHost: ts.LanguageServiceHost;
};
export {};
