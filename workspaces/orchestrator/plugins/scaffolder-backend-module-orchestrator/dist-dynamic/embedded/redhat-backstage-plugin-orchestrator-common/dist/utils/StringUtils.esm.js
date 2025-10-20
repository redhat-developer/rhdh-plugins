const capitalize = (text) => text[0].toLocaleUpperCase("en-US") + text.slice(1).toLocaleLowerCase("en-US");
const ellipsis = (text, prefixLength = 8) => `${text.slice(0, prefixLength)}...`;

export { capitalize, ellipsis };
//# sourceMappingURL=StringUtils.esm.js.map
