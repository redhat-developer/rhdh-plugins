"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const util_1 = require("util");
exports.exec = util_1.promisify(child_process_1.exec);
//# sourceMappingURL=exec.js.map