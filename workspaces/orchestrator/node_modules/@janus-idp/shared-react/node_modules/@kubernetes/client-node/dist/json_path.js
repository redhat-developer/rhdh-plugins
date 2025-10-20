"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonpath = jsonpath;
const jsonpath_plus_1 = require("jsonpath-plus");
function jsonpath(path, json) {
    return (0, jsonpath_plus_1.JSONPath)({
        path,
        json,
        eval: false,
    });
}
//# sourceMappingURL=json_path.js.map