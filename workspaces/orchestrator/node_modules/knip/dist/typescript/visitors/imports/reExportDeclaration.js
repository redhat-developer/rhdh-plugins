import ts from 'typescript';
import { IMPORT_STAR } from '../../../constants.js';
import { importVisitor as visit } from '../index.js';
export default visit(() => true, node => {
    if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
            if (!node.exportClause) {
                return { identifier: IMPORT_STAR, specifier: node.moduleSpecifier.text, isReExport: true, pos: node.pos };
            }
            if (node.exportClause.kind === ts.SyntaxKind.NamespaceExport) {
                return {
                    identifier: IMPORT_STAR,
                    namespace: String(node.exportClause.name.text),
                    specifier: node.moduleSpecifier.text,
                    isReExport: true,
                    pos: node.exportClause.name.pos,
                };
            }
            const specifier = node.moduleSpecifier;
            return node.exportClause.elements.map(element => {
                if (element.propertyName && element.name) {
                    return {
                        identifier: String(element.propertyName.text),
                        alias: String(element.name.text),
                        specifier: specifier.text,
                        isReExport: true,
                        pos: element.pos,
                    };
                }
                return {
                    identifier: (element.propertyName ?? element.name).getText(),
                    specifier: specifier.text,
                    isReExport: true,
                    pos: element.pos,
                };
            });
        }
    }
});
