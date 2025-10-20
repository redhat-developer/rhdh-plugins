"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const ignore_1 = __importDefault(require("ignore"));
const path_1 = __importDefault(require("path"));
exports.readDir = async (dir, filters = []) => {
    return new Promise((resolve, reject) => {
        try {
            const ignores = ignore_1.default().add(filters);
            const files = walkDir(dir, '', ignores);
            resolve(files);
        }
        catch (e) {
            reject(e);
        }
    });
};
const walkDir = (root, dir, ignores, files = []) => {
    const newFiles = fs_1.default.readdirSync(path_1.default.resolve(root, dir));
    const newGitIgnore = newFiles.find(file => file === '.gitignore');
    let appliedIgnores = ignores;
    if (newGitIgnore) {
        const contents = fs_1.default.readFileSync(path_1.default.resolve(root, dir, newGitIgnore)).toString();
        appliedIgnores = ignore_1.default().add(ignores).add(contents);
    }
    for (const file of newFiles) {
        if (appliedIgnores.ignores(file) || appliedIgnores.ignores(path_1.default.join(dir, file))) {
            continue;
        }
        let stats = undefined;
        try {
            stats = fs_1.default.statSync(path_1.default.resolve(root, dir, file));
        }
        catch (e) {
            continue; // Ignore missing files and symlinks
        }
        if (stats && stats.isDirectory()) {
            walkDir(root, path_1.default.join(dir, file), appliedIgnores, files);
        }
        if (stats && stats.isFile()) {
            files.push(path_1.default.join(dir, file));
        }
    }
    return files;
};
//# sourceMappingURL=readDir.js.map