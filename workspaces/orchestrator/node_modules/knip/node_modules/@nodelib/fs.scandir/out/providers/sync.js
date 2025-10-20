"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.read = read;
const fsStat = require("@nodelib/fs.stat");
const utils = require("../utils");
const common = require("./common");
function read(directory, settings) {
    const dirents = settings.fs.readdirSync(directory, { withFileTypes: true });
    return dirents.map((dirent) => {
        const entry = {
            dirent,
            name: dirent.name,
            path: common.joinPathSegments(directory, dirent.name, settings.pathSegmentSeparator),
        };
        if (settings.stats) {
            entry.stats = fsStat.statSync(entry.path, settings.fsStatSettings);
        }
        if (settings.followSymbolicLinks && entry.dirent.isSymbolicLink()) {
            try {
                const stats = entry.stats ?? settings.fs.statSync(entry.path);
                entry.dirent = utils.fs.createDirentFromStats(entry.name, stats, directory);
            }
            catch (error) {
                if (settings.throwErrorOnBrokenSymbolicLink) {
                    throw error;
                }
            }
        }
        return entry;
    });
}
