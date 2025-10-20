"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = void 0;
const path = require("node:path");
const fsScandir = require("@nodelib/fs.scandir");
class Settings {
    basePath;
    concurrency;
    deepFilter;
    entryFilter;
    errorFilter;
    pathSegmentSeparator;
    fsScandirSettings;
    signal;
    constructor(options = {}) {
        this.basePath = options.basePath ?? undefined;
        this.concurrency = options.concurrency ?? Number.POSITIVE_INFINITY;
        this.deepFilter = options.deepFilter ?? null;
        this.entryFilter = options.entryFilter ?? null;
        this.errorFilter = options.errorFilter ?? null;
        this.pathSegmentSeparator = options.pathSegmentSeparator ?? path.sep;
        this.signal = options.signal;
        this.fsScandirSettings = new fsScandir.Settings({
            followSymbolicLinks: options.followSymbolicLinks,
            fs: options.fs,
            pathSegmentSeparator: this.pathSegmentSeparator,
            stats: options.stats,
            throwErrorOnBrokenSymbolicLink: options.throwErrorOnBrokenSymbolicLink,
        });
    }
}
exports.Settings = Settings;
