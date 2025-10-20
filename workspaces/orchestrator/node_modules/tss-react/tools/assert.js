"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assert = void 0;
/** https://docs.tsafe.dev/assert */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assert(condition, msg) {
    if (!condition) {
        throw new Error(msg);
    }
}
exports.assert = assert;
