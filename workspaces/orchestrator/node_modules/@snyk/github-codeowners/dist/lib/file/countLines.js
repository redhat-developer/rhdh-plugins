"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const logger_1 = require("../logger");
exports.countLines = async (filePath) => {
    let i;
    let count = 0;
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .on('error', (e) => {
            logger_1.log.error(`failed to read lines from file ${filePath}`, e);
            reject(e);
        })
            .on('data', (chunk) => {
            for (i = 0; i < chunk.length; ++i)
                if (chunk[i] === 10)
                    count++;
        })
            .on('end', () => resolve(count));
    });
};
//# sourceMappingURL=countLines.js.map