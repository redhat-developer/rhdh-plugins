import { EOL } from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { getCompilerExtensions } from '../compilers/index.js';
import { SourceFileManager } from './SourceFileManager.js';
import { createCustomModuleResolver } from './resolve-module-names.js';
const libLocation = path.dirname(ts.getDefaultLibFilePath({}));
export const createHosts = ({ cwd, compilerOptions, entryPaths, compilers, isSkipLibs, toSourceFilePath, useResolverCache, }) => {
    const fileManager = new SourceFileManager({ compilers, isSkipLibs });
    const compilerExtensions = getCompilerExtensions(compilers);
    const resolveModuleNames = createCustomModuleResolver(compilerOptions, compilerExtensions, toSourceFilePath, useResolverCache, isSkipLibs);
    const languageServiceHost = {
        getCompilationSettings: () => compilerOptions,
        getScriptFileNames: () => Array.from(entryPaths),
        getScriptVersion: () => '0',
        getScriptSnapshot: (fileName) => fileManager.getSnapshot(fileName),
        getCurrentDirectory: () => cwd,
        getDefaultLibFileName: ts.getDefaultLibFilePath,
        readFile: ts.sys.readFile,
        fileExists: ts.sys.fileExists,
        resolveModuleNames,
    };
    const compilerHost = {
        writeFile: () => undefined,
        getDefaultLibLocation: () => libLocation,
        getDefaultLibFileName: languageServiceHost.getDefaultLibFileName,
        getSourceFile: (fileName) => fileManager.getSourceFile(fileName),
        getCurrentDirectory: languageServiceHost.getCurrentDirectory,
        getCanonicalFileName: (fileName) => fileName,
        useCaseSensitiveFileNames: () => true,
        getNewLine: () => EOL,
        readFile: languageServiceHost.readFile,
        fileExists: languageServiceHost.fileExists,
        resolveModuleNames: languageServiceHost.resolveModuleNames,
    };
    return { fileManager, compilerHost, resolveModuleNames, languageServiceHost };
};
