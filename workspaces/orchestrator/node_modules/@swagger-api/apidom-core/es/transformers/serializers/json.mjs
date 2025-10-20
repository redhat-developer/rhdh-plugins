import serializeValue from "./value/index.mjs";
const serializer = (element, replacer, space) => JSON.stringify(serializeValue(element), replacer, space);
export default serializer;