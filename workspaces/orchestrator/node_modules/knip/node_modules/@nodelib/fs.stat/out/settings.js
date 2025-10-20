"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = void 0;
const fs = require("./adapters/fs");
class Settings {
    followSymbolicLink;
    fs;
    markSymbolicLink;
    throwErrorOnBrokenSymbolicLink;
    constructor(options = {}) {
        this.followSymbolicLink = options.followSymbolicLink ?? true;
        this.fs = fs.createFileSystemAdapter(options.fs);
        this.markSymbolicLink = options.markSymbolicLink ?? false;
        this.throwErrorOnBrokenSymbolicLink = options.throwErrorOnBrokenSymbolicLink ?? true;
    }
}
exports.Settings = Settings;
