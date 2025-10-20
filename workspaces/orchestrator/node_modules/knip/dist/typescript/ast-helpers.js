import ts from 'typescript';
export function isGetOrSetAccessorDeclaration(node) {
    return node.kind === ts.SyntaxKind.SetAccessor || node.kind === ts.SyntaxKind.GetAccessor;
}
export function isPrivateMember(node) {
    return node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.PrivateKeyword) ?? false;
}
export function isDefaultImport(node) {
    return node.kind === ts.SyntaxKind.ImportDeclaration && !!node.importClause && !!node.importClause.name;
}
export function isAccessExpression(node) {
    return ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node);
}
export function isImportCall(node) {
    return (node.kind === ts.SyntaxKind.CallExpression &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword);
}
export function isRequireCall(callExpression) {
    if (callExpression.kind !== ts.SyntaxKind.CallExpression) {
        return false;
    }
    const { expression, arguments: args } = callExpression;
    if (expression.kind !== ts.SyntaxKind.Identifier || expression.escapedText !== 'require') {
        return false;
    }
    return args.length === 1;
}
export function isPropertyAccessCall(node, identifier) {
    return (ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.getText() === identifier);
}
export function stripQuotes(name) {
    const length = name.length;
    if (length >= 2 && name.charCodeAt(0) === name.charCodeAt(length - 1) && isQuoteOrBacktick(name.charCodeAt(0))) {
        return name.substring(1, length - 1);
    }
    return name;
}
var CharacterCodes;
(function (CharacterCodes) {
    CharacterCodes[CharacterCodes["backtick"] = 96] = "backtick";
    CharacterCodes[CharacterCodes["doubleQuote"] = 34] = "doubleQuote";
    CharacterCodes[CharacterCodes["singleQuote"] = 39] = "singleQuote";
})(CharacterCodes || (CharacterCodes = {}));
function isQuoteOrBacktick(charCode) {
    return (charCode === CharacterCodes.singleQuote ||
        charCode === CharacterCodes.doubleQuote ||
        charCode === CharacterCodes.backtick);
}
export function findAncestor(node, callback) {
    node = node?.parent;
    while (node) {
        const result = callback(node);
        if (result === 'STOP') {
            return undefined;
        }
        if (result) {
            return node;
        }
        node = node.parent;
    }
    return undefined;
}
export function findDescendants(node, callback) {
    const results = [];
    if (!node)
        return results;
    function visit(node) {
        const result = callback(node);
        if (result === 'STOP') {
            return;
        }
        if (result) {
            results.push(node);
        }
        ts.forEachChild(node, visit);
    }
    visit(node);
    return results;
}
export const isDeclarationFileExtension = (extension) => extension === '.d.ts' || extension === '.d.mts' || extension === '.d.cts';
export const getJSDocTags = (node) => {
    const tags = new Set();
    let tagNodes = ts.getJSDocTags(node);
    if (ts.isExportSpecifier(node) || ts.isBindingElement(node)) {
        tagNodes = [...tagNodes, ...ts.getJSDocTags(node.parent.parent)];
    }
    else if (ts.isEnumMember(node) || ts.isClassElement(node)) {
        tagNodes = [...tagNodes, ...ts.getJSDocTags(node.parent)];
    }
    else if (ts.isCallExpression(node)) {
        tagNodes = [...tagNodes, ...ts.getJSDocTags(node.parent)];
    }
    for (const tagNode of tagNodes) {
        const match = tagNode.getText()?.match(/@\S+/);
        if (match)
            tags.add(match[0]);
    }
    return tags;
};
export const getLineAndCharacterOfPosition = (node, pos) => {
    const { line, character } = node.getSourceFile().getLineAndCharacterOfPosition(pos);
    return { line: line + 1, col: character + 1, pos };
};
const getMemberStringLiterals = (typeChecker, node) => {
    if (ts.isElementAccessExpression(node)) {
        if (ts.isStringLiteral(node.argumentExpression))
            return [node.argumentExpression.text];
        const type = typeChecker.getTypeAtLocation(node.argumentExpression);
        if (type.isUnion())
            return type.types.map(type => type.value);
    }
    if (ts.isPropertyAccessExpression(node)) {
        return [node.name.escapedText];
    }
};
export const getAccessMembers = (typeChecker, node) => {
    let members = [];
    let current = node.parent;
    while (current) {
        const ms = getMemberStringLiterals(typeChecker, current);
        if (!ms)
            break;
        const joinIds = (id) => (members.length === 0 ? id : members.map(ns => `${ns}.${id}`));
        members = members.concat(ms.flatMap(joinIds));
        current = current.parent;
    }
    return members;
};
export const isDestructuring = (node) => node.parent &&
    ts.isVariableDeclaration(node.parent) &&
    ts.isVariableDeclarationList(node.parent.parent) &&
    ts.isObjectBindingPattern(node.parent.name);
export const getDestructuredIds = (name) => name.elements.map(element => element.name.getText());
export const isConsiderReferencedNS = (node) => ts.isPropertyAssignment(node.parent) ||
    ts.isShorthandPropertyAssignment(node.parent) ||
    (ts.isCallExpression(node.parent) && node.parent.arguments.includes(node)) ||
    ts.isSpreadAssignment(node.parent) ||
    ts.isArrayLiteralExpression(node.parent) ||
    ts.isExportAssignment(node.parent) ||
    (ts.isVariableDeclaration(node.parent) && node.parent.initializer === node) ||
    ts.isTypeQueryNode(node.parent);
const objectEnumerationMethods = new Set(['keys', 'entries', 'values', 'getOwnPropertyNames']);
export const isObjectEnumerationCallExpressionArgument = (node) => ts.isCallExpression(node.parent) &&
    node.parent.arguments.includes(node) &&
    ts.isPropertyAccessExpression(node.parent.expression) &&
    ts.isIdentifier(node.parent.expression.expression) &&
    node.parent.expression.expression.escapedText === 'Object' &&
    objectEnumerationMethods.has(String(node.parent.expression.name.escapedText));
export const isInForIteration = (node) => node.parent && (ts.isForInStatement(node.parent) || ts.isForOfStatement(node.parent));
export const isTopLevel = (node) => ts.isSourceFile(node.parent) || (node.parent && ts.isSourceFile(node.parent.parent));
export const getTypeRef = (node) => {
    if (!node.parent?.parent)
        return;
    return findAncestor(node, _node => ts.isTypeReferenceNode(_node));
};
export const isImportSpecifier = (node) => ts.isImportSpecifier(node.parent) ||
    ts.isImportEqualsDeclaration(node.parent) ||
    ts.isImportClause(node.parent) ||
    ts.isNamespaceImport(node.parent);
const isInExportedNode = (node) => {
    if (getExportKeywordNode(node))
        return true;
    return node.parent ? isInExportedNode(node.parent) : false;
};
export const isReferencedInExport = (node) => {
    if (ts.isTypeQueryNode(node.parent) && isInExportedNode(node.parent.parent))
        return true;
    if (ts.isTypeReferenceNode(node.parent) && isInExportedNode(node.parent.parent))
        return true;
    return false;
};
export const getExportKeywordNode = (node) => node.modifiers?.find(mod => mod.kind === ts.SyntaxKind.ExportKeyword);
export const getDefaultKeywordNode = (node) => node.modifiers?.find(mod => mod.kind === ts.SyntaxKind.DefaultKeyword);
export const hasRequireCall = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require')
        return true;
    return node.getChildren().some(child => hasRequireCall(child));
};
export const isModuleExportsAccess = (node) => ts.isIdentifier(node.expression) && node.expression.escapedText === 'module' && node.name.escapedText === 'exports';
