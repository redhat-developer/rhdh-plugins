"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const readGit_1 = require("./readGit");
const readDir_1 = require("./readDir");
const path = __importStar(require("path"));
var FILE_DISCOVERY_STRATEGY;
(function (FILE_DISCOVERY_STRATEGY) {
    FILE_DISCOVERY_STRATEGY[FILE_DISCOVERY_STRATEGY["FILE_SYSTEM"] = 0] = "FILE_SYSTEM";
    FILE_DISCOVERY_STRATEGY[FILE_DISCOVERY_STRATEGY["GIT_LS"] = 1] = "GIT_LS";
})(FILE_DISCOVERY_STRATEGY = exports.FILE_DISCOVERY_STRATEGY || (exports.FILE_DISCOVERY_STRATEGY = {}));
exports.getFilePaths = async (dir, strategy, root) => {
    let filePaths;
    if (strategy === FILE_DISCOVERY_STRATEGY.GIT_LS) {
        filePaths = await readGit_1.readGit(dir);
    }
    else {
        filePaths = await readDir_1.readDir(dir, ['.git']);
    }
    if (root) { // We need to re-add the root so that later ops can find the file
        filePaths = filePaths.map(filePath => path.join(root, filePath));
    }
    filePaths.sort();
    return filePaths;
};
//# sourceMappingURL=getFilePaths.js.map