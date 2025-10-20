import ts from 'typescript';
import type { ImportNode } from '../../../types/imports.js';
declare const _default: (sourceFile: ts.SourceFile) => (node: ts.Node, options: import("../../../types/config.js").GetImportsAndExportsOptions) => ImportNode | ImportNode[] | undefined;
export default _default;
