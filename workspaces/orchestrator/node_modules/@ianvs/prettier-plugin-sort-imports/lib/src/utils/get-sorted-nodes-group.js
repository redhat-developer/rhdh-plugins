"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSortedNodesGroup = void 0;
const natural_sort_1 = require("../natural-sort");
const getSortedNodesGroup = (imports, options) => {
    const { importOrderCaseSensitive } = options || {};
    const sortFn = importOrderCaseSensitive
        ? natural_sort_1.naturalSortCaseSensitive
        : natural_sort_1.naturalSort;
    return imports.sort((a, b) => sortFn(a.source.value, b.source.value));
};
exports.getSortedNodesGroup = getSortedNodesGroup;
