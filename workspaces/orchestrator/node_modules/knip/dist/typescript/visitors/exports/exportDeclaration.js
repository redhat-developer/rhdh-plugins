import ts from 'typescript';
import { FIX_FLAGS } from '../../../constants.js';
import { SymbolType } from '../../../types/issues.js';
import { isModule } from '../helpers.js';
import { exportVisitor as visit } from '../index.js';
export default visit(isModule, (node, { isFixExports, isFixTypes }) => {
    if (ts.isExportDeclaration(node)) {
        if (node.exportClause && ts.isNamedExports(node.exportClause)) {
            const nodeType = node.isTypeOnly ? SymbolType.TYPE : SymbolType.UNKNOWN;
            const sourceFile = node.getSourceFile();
            const declarations = sourceFile.getNamedDeclarations?.();
            return node.exportClause.elements.map(element => {
                const identifier = String(element.name.text);
                const propName = element.propertyName?.text;
                const symbol = declarations?.get(propName ?? identifier)?.[0]?.symbol;
                const pos = element.name.pos;
                const type = element.isTypeOnly ? SymbolType.TYPE : nodeType;
                const fix = (isFixExports && type !== SymbolType.TYPE) || (isFixTypes && type === SymbolType.TYPE)
                    ? [element.getStart(), element.getEnd(), FIX_FLAGS.OBJECT_BINDING | FIX_FLAGS.EMPTY_DECLARATION]
                    : undefined;
                return { node: element, symbol, identifier, type, pos, fix };
            });
        }
    }
});
