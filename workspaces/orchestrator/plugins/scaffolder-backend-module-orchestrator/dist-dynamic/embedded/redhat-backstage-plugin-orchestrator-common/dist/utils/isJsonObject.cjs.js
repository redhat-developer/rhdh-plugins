'use strict';

function isJsonObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

exports.isJsonObject = isJsonObject;
//# sourceMappingURL=isJsonObject.cjs.js.map
