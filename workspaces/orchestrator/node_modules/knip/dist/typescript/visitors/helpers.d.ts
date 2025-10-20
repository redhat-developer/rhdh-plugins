import ts from 'typescript';
import type { ImportNode } from '../../types/imports.js';
import type { BoundSourceFile } from '../SourceFile.js';
export declare const isNotJS: (sourceFile: BoundSourceFile) => boolean;
export declare const isJS: (sourceFile: BoundSourceFile) => boolean;
export declare const isModule: (sourceFile: BoundSourceFile) => boolean;
export declare function getImportsFromPragmas(sourceFile: BoundSourceFile): ImportNode[];
export declare function hasImportSpecifier(node: ts.Statement, name: string, id?: string): boolean;
