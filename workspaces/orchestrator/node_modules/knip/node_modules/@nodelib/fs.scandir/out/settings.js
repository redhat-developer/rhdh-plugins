"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = void 0;
const path = require("node:path");
const fsStat = require("@nodelib/fs.stat");
const fs = require("./adapters/fs");
class Settings {
    followSymbolicLinks;
    fs;
    pathSegmentSeparator;
    stats;
    throwErrorOnBrokenSymbolicLink;
    fsStatSettings;
    constructor(options = {}) {
        this.followSymbolicLinks = options.followSymbolicLinks ?? false;
        this.fs = fs.createFileSystemAdapter(options.fs);
        this.pathSegmentSeparator = options.pathSegmentSeparator ?? path.sep;
        this.stats = options.stats ?? false;
        this.throwErrorOnBrokenSymbolicLink = options.throwErrorOnBrokenSymbolicLink ?? true;
        this.fsStatSettings = new fsStat.Settings({
            followSymbolicLink: this.followSymbolicLinks,
            fs: this.fs,
            throwErrorOnBrokenSymbolicLink: this.throwErrorOnBrokenSymbolicLink,
        });
    }
}
exports.Settings = Settings;
