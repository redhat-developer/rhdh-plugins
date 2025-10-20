"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILE_SYSTEM_ADAPTER = void 0;
exports.createFileSystemAdapter = createFileSystemAdapter;
const fs = require("node:fs");
exports.FILE_SYSTEM_ADAPTER = {
    lstat: fs.lstat,
    stat: fs.stat,
    lstatSync: fs.lstatSync,
    statSync: fs.statSync,
    readdir: fs.readdir,
    readdirSync: fs.readdirSync,
};
function createFileSystemAdapter(fsMethods) {
    if (fsMethods === undefined) {
        return exports.FILE_SYSTEM_ADAPTER;
    }
    return {
        ...exports.FILE_SYSTEM_ADAPTER,
        ...fsMethods,
    };
}
