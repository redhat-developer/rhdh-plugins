"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const exec_1 = require("../util/exec");
exports.readGit = async (dir) => {
    const { stdout } = await exec_1.exec('git ls-files', { cwd: dir });
    return stdout.split('\n').filter((filePath) => {
        let stats = undefined;
        try {
            stats = fs_1.default.statSync(filePath);
        }
        catch (e) {
            return false; // Ignore missing files and symlinks
        }
        // Ignore if path is not a file
        if (!stats.isFile()) {
            return false;
        }
        return true;
    });
};
//# sourceMappingURL=readGit.js.map