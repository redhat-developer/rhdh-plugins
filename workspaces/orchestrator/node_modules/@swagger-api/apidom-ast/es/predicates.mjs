export const isNodeType = (type, node) => node != null && typeof node === 'object' && 'type' in node && node.type === type;
export const isLiteral = node => isNodeType('literal', node);
export const isPosition = node => isNodeType('position', node);
export const isPoint = node => isNodeType('point', node);
export const isParseResult = node => isNodeType('parseResult', node);