"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ownership_1 = require("../lib/ownership");
const logger_1 = require("../lib/logger");
exports.validate = async (options) => {
    const results = await ownership_1.validate(options); // will throw on errors such as badly formatted rules
    if (results.duplicated.size > 0) {
        logger_1.log.warn('Found duplicate rules', Array.from(results.duplicated.values()));
    }
    if (results.unmatched.size > 0) {
        logger_1.log.warn('Found rules which did not match any files', Array.from(results.unmatched.values()));
    }
};
//# sourceMappingURL=validate.js.map