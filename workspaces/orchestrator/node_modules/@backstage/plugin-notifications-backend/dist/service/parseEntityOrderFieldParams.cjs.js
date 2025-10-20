'use strict';

var errors = require('@backstage/errors');

function parseStringsParam(param, ctx) {
  if (param === void 0) {
    return void 0;
  }
  const array = [param].flat();
  if (array.some((p) => typeof p !== "string")) {
    throw new errors.InputError(`Invalid ${ctx}, not a string`);
  }
  return array;
}
function parseEntityOrderFieldParams(params) {
  const orderFieldStrings = parseStringsParam(params.orderField, "orderField");
  if (!orderFieldStrings) {
    return void 0;
  }
  return orderFieldStrings.map((orderFieldString) => {
    const [field, order] = orderFieldString.split(",");
    if (order !== void 0 && !isOrder(order)) {
      throw new errors.InputError("Invalid order field order, must be asc or desc");
    }
    return { field, order };
  });
}
function isOrder(order) {
  return ["asc", "desc"].includes(order);
}

exports.isOrder = isOrder;
exports.parseEntityOrderFieldParams = parseEntityOrderFieldParams;
exports.parseStringsParam = parseStringsParam;
//# sourceMappingURL=parseEntityOrderFieldParams.cjs.js.map
