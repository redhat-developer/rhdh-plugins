import ts from 'typescript';
import { IMPORT_STAR } from '../../../constants.js';
import { findAncestor, findDescendants, isModuleExportsAccess, isRequireCall, isTopLevel } from '../../ast-helpers.js';
import { isNotJS } from '../helpers.js';
import { importVisitor as visit } from '../index.js';
export default visit(() => true, node => {
    if (isRequireCall(node)) {
        if (ts.isStringLiteralLike(node.arguments[0])) {
            const specifier = node.arguments[0].text;
            if (specifier) {
                const propertyAccessExpression = findAncestor(node, _node => {
                    if (ts.isExpressionStatement(_node) || ts.isCallExpression(_node))
                        return 'STOP';
                    return ts.isPropertyAccessExpression(_node);
                });
                const resolve = isNotJS(node.getSourceFile());
                if (propertyAccessExpression) {
                    const identifier = String(propertyAccessExpression.name.escapedText);
                    return { identifier, specifier, pos: propertyAccessExpression.name.pos, resolve };
                }
                const variableDeclaration = node.parent;
                if (ts.isVariableDeclaration(variableDeclaration) &&
                    ts.isVariableDeclarationList(variableDeclaration.parent)) {
                    const isTLA = isTopLevel(variableDeclaration.parent);
                    if (ts.isIdentifier(variableDeclaration.name)) {
                        const alias = String(variableDeclaration.name.escapedText);
                        return {
                            identifier: 'default',
                            alias,
                            symbol: isTLA ? variableDeclaration.symbol : undefined,
                            specifier,
                            pos: node.arguments[0].pos,
                            resolve,
                        };
                    }
                    const bindings = findDescendants(variableDeclaration, ts.isBindingElement);
                    if (bindings.length > 0) {
                        return bindings.map(element => {
                            const identifier = (element.propertyName ?? element.name).getText();
                            const alias = element.propertyName ? element.name.getText() : undefined;
                            const symbol = isTLA ? element.symbol : undefined;
                            return { identifier, specifier, alias, symbol, pos: element.pos, resolve };
                        });
                    }
                    return { identifier: 'default', specifier, pos: node.arguments[0].pos, resolve };
                }
                if (ts.isBinaryExpression(node.parent) &&
                    ts.isPropertyAccessExpression(node.parent.left) &&
                    isModuleExportsAccess(node.parent.left)) {
                    return { identifier: IMPORT_STAR, specifier, isReExport: true, pos: node.arguments[0].pos };
                }
                return { identifier: 'default', specifier, pos: node.arguments[0].pos, resolve };
            }
        }
    }
});
