"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const p_map_1 = __importDefault(require("p-map"));
const stats_1 = require("../lib/stats");
const ownership_1 = require("../lib/ownership");
const file_1 = require("../lib/file");
exports.audit = async (options) => {
    const strategy = options.onlyGit ? file_1.FILE_DISCOVERY_STRATEGY.GIT_LS : file_1.FILE_DISCOVERY_STRATEGY.FILE_SYSTEM;
    const filePaths = await file_1.getFilePaths(options.dir, strategy, options.root);
    const files = await ownership_1.getOwnership(options.codeowners, filePaths);
    if (options.stats) {
        await p_map_1.default(files, f => f.updateLineCount(), { concurrency: 100 });
        const stats = stats_1.calcFileStats(files);
        stats_1.statsWriter(stats, options, process.stdout);
        return;
    }
    for (const file of files) {
        if (options.unloved) {
            if (file.owners.length < 1) {
                file.write(options.output, process.stdout);
            }
        }
        else {
            file.write(options.output, process.stdout);
        }
    }
};
//# sourceMappingURL=audit.js.map