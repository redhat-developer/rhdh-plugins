"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSortedImportSpecifiers = void 0;
const natural_sort_1 = require("../natural-sort");
/**
 * This function returns import nodes with alphabetically sorted module
 * specifiers.
 *
 * type imports are sorted separately, and placed after value imports.
 *
 * Comments need to be fixed up so they attach to the right objects.
 *
 * @param node Import declaration node
 */
const getSortedImportSpecifiers = (node, options) => {
    const { importOrderCaseSensitive } = options || {};
    node.specifiers.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'ImportDefaultSpecifier' ? -1 : 1;
        }
        if (a.type === 'ImportSpecifier' &&
            b.type === 'ImportSpecifier' &&
            a.importKind !== b.importKind) {
            // flow uses null for value import specifiers
            return a.importKind === 'value' || a.importKind == null ? -1 : 1;
        }
        const sortFn = importOrderCaseSensitive
            ? natural_sort_1.naturalSortCaseSensitive
            : natural_sort_1.naturalSort;
        return sortFn(a.local.name, b.local.name);
    });
    return node;
};
exports.getSortedImportSpecifiers = getSortedImportSpecifiers;
