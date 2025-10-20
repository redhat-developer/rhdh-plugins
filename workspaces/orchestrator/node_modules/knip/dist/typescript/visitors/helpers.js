import ts from 'typescript';
export const isNotJS = (sourceFile) => !isJS(sourceFile);
export const isJS = (sourceFile) => sourceFile.scriptKind === ts.ScriptKind.JS || sourceFile.scriptKind === ts.ScriptKind.JSX;
export const isModule = (sourceFile) => ts.isExternalModule(sourceFile);
export function getImportsFromPragmas(sourceFile) {
    const importNodes = [];
    if (sourceFile.pragmas) {
        const jsxImportSourcePragmas = sourceFile.pragmas.get('jsximportsource');
        if (jsxImportSourcePragmas) {
            const jsxImportSourcePragma = Array.isArray(jsxImportSourcePragmas)
                ? jsxImportSourcePragmas[jsxImportSourcePragmas.length - 1]
                : jsxImportSourcePragmas;
            const { factory: specifier } = jsxImportSourcePragma?.arguments ?? {};
            const pos = jsxImportSourcePragma.range?.pos ?? 0;
            if (specifier)
                importNodes.push({ specifier, isTypeOnly: true, identifier: '__jsx', pos });
        }
        const referencePragma = sourceFile.pragmas.get('reference');
        if (referencePragma) {
            const refs = [referencePragma].flat();
            for (const ref of refs) {
                if (ref.arguments?.types) {
                    const { value: specifier, pos } = ref.arguments.types;
                    if (specifier)
                        importNodes.push({ specifier, isTypeOnly: true, identifier: undefined, pos });
                }
            }
        }
    }
    return importNodes;
}
export function hasImportSpecifier(node, name, id) {
    return (ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text === name &&
        !!node.importClause?.namedBindings &&
        ts.isNamedImports(node.importClause.namedBindings) &&
        (!id || node.importClause.namedBindings.elements.some(element => element.name.text === id)));
}
