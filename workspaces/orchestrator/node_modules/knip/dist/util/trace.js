import picocolors from 'picocolors';
import parsedArgValues from './cli-arguments.js';
import { toAbsolute, toRelative } from './path.js';
const IS_ENTRY = ' ◯';
const HAS_REF = ' ✓';
const HAS_NO_REF = ' x';
const { 'trace-export': traceExport, 'trace-file': traceFile, trace } = parsedArgValues;
const isTrace = Boolean(trace || traceExport || traceFile);
export { isTrace };
const getPadding = (level, levels) => {
    let padding = '';
    for (let i = 0; i < level; i++)
        padding += levels.has(i) ? `${picocolors.dim('│')}  ` : '   ';
    return padding;
};
const renderTrace = (node, level = 0, levels = new Set()) => {
    let index = 0;
    const size = node.children.size;
    const padding = getPadding(level, levels);
    for (const child of node.children) {
        const isLast = ++index === size;
        const hasRef = child.hasRef === true;
        const rel = toRelative(child.filePath);
        const file = hasRef ? rel : picocolors.dim(rel);
        const suffix = (hasRef ? HAS_REF : '') + (child.isEntry ? IS_ENTRY : '');
        const text = `${padding}${picocolors.dim(isLast ? '└─' : '├─')} ${file}${suffix}`;
        console.log(text);
        if (child.children.size > 0) {
            if (!isLast)
                levels.add(level);
            if (isLast)
                levels.delete(level);
            renderTrace(child, level + 1, levels);
        }
    }
};
export const printTrace = isTrace
    ? (node, filePath, identifier) => {
        if (traceExport && identifier && identifier !== traceExport)
            return;
        if (traceFile && filePath !== toAbsolute(traceFile))
            return;
        const suffix = (node.isEntry ? IS_ENTRY : '') + (node.children.size === 0 ? HAS_NO_REF : '');
        const header = `${toRelative(filePath)}${identifier ? `:${identifier}` : ''}${suffix}`;
        console.log(header);
        renderTrace(node);
        console.log();
    }
    : () => { };
export const createNode = (filePath, { hasRef = false, isEntry = false, identifier } = {}) => ({
    filePath,
    identifier,
    hasRef,
    isEntry,
    children: new Set(),
});
const addNode = (parent, filePath, { hasRef = false, isEntry = false }) => {
    const node = createNode(filePath, { hasRef, isEntry });
    parent.children.add(node);
    return node;
};
export const addNodes = (node, id, importedSymbols, filePaths) => {
    if (!filePaths)
        return;
    for (const filePath of filePaths) {
        addNode(node, filePath, { hasRef: Boolean(importedSymbols.get(filePath)?.traceRefs?.has(id)) });
    }
};
export const createAndPrintTrace = (filePath, options = {}) => {
    if (!isTrace || traceExport || traceFile)
        return;
    const traceNode = createNode(filePath, options);
    printTrace(traceNode, filePath, options.identifier);
};
