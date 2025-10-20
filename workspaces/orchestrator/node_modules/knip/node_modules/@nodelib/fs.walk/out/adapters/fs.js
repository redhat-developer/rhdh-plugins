"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemAdapter = void 0;
const fsScandir = require("@nodelib/fs.scandir");
class FileSystemAdapter {
    scandir = fsScandir.scandir;
    scandirSync = fsScandir.scandirSync;
}
exports.FileSystemAdapter = FileSystemAdapter;
