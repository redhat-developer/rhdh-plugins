"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setOptionValues = void 0;
function setOptionValues(options, object) {
    for (const key of Object.keys(object)) {
        if (options[key] !== undefined) {
            object[key] = options[key];
        }
    }
    return object;
}
exports.setOptionValues = setOptionValues;
