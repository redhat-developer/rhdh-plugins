import ts from 'typescript';
import type { AsyncCompilers, SyncCompilers } from '../compilers/types.js';
interface SourceFileManagerOptions {
    isSkipLibs: boolean;
    compilers: [SyncCompilers, AsyncCompilers];
}
export declare class SourceFileManager {
    isSkipLibs: boolean;
    sourceFileCache: Map<string, ts.SourceFile | undefined>;
    snapshotCache: Map<string, ts.IScriptSnapshot | undefined>;
    syncCompilers: SyncCompilers;
    asyncCompilers: AsyncCompilers;
    constructor({ compilers, isSkipLibs }: SourceFileManagerOptions);
    createSourceFile(filePath: string, contents: string): ts.SourceFile;
    getSourceFile(filePath: string): ts.SourceFile | undefined;
    getSnapshot(filePath: string): ts.IScriptSnapshot | undefined;
    compileAndAddSourceFile(filePath: string): Promise<void>;
}
export {};
