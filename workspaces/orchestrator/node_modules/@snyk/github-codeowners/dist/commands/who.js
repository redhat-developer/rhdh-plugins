"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ownership_1 = require("../lib/ownership");
exports.who = async (options) => {
    const files = await ownership_1.getOwnership(options.codeowners, options.files);
    for (const file of files) {
        file.write(options.output, process.stdout);
    }
};
//# sourceMappingURL=who.js.map