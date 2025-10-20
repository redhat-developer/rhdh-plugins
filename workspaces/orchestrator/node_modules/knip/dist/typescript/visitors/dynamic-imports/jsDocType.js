import ts from 'typescript';
import { importVisitor as visit } from '../index.js';
const supportsJSDocImportTag = 'isJSDocImportTag' in ts;
const getImportSpecifiers = (node) => {
    const imports = [];
    function visit(node) {
        if (ts.isImportTypeNode(node)) {
            const importClause = node.argument;
            if (ts.isLiteralTypeNode(importClause) && ts.isStringLiteral(importClause.literal)) {
                const identifier = node.qualifier && ts.isIdentifier(node.qualifier) ? String(node.qualifier.escapedText) : 'default';
                imports.push({ specifier: importClause.literal.text, identifier, pos: importClause.literal.pos });
            }
        }
        if (supportsJSDocImportTag && ts.isJSDocImportTag(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
            const moduleSpecifier = node.moduleSpecifier;
            imports.push({ specifier: moduleSpecifier.text, identifier: undefined, pos: moduleSpecifier.pos });
        }
        ts.forEachChild(node, visit);
    }
    visit(node);
    return imports;
};
export default visit(() => true, node => {
    if ('jsDoc' in node && node.jsDoc) {
        const jsDoc = node.jsDoc;
        if (jsDoc.length > 0 && jsDoc[0].parent.parent === node.parent) {
            return jsDoc.flatMap(jsDoc => (jsDoc.tags ?? []).flatMap(getImportSpecifiers));
        }
    }
    return [];
});
