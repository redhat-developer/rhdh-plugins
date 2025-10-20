"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.read = read;
const fsStat = require("@nodelib/fs.stat");
const rpl = require("run-parallel");
const utils = require("../utils");
const common = require("./common");
function read(directory, settings, callback) {
    settings.fs.readdir(directory, { withFileTypes: true }, (readdirError, dirents) => {
        if (readdirError !== null) {
            callFailureCallback(callback, readdirError);
            return;
        }
        const entries = dirents.map((dirent) => ({
            dirent,
            name: dirent.name,
            path: common.joinPathSegments(directory, dirent.name, settings.pathSegmentSeparator),
        }));
        if (!settings.stats && !settings.followSymbolicLinks) {
            callSuccessCallback(callback, entries);
            return;
        }
        const tasks = makeRplTasks(directory, entries, settings);
        rpl(tasks, (rplError) => {
            if (rplError !== null) {
                callFailureCallback(callback, rplError);
                return;
            }
            callSuccessCallback(callback, entries);
        });
    });
}
function makeRplTasks(directory, entries, settings) {
    const tasks = [];
    for (const entry of entries) {
        const task = makeRplTask(directory, entry, settings);
        if (task !== undefined) {
            tasks.push(task);
        }
    }
    return tasks;
}
/**
 * The task mutates the incoming entry object depending on the settings.
 * Returns the task, or undefined if the task is empty.
 */
function makeRplTask(directory, entry, settings) {
    const action = getStatsAction(entry, settings);
    if (action === undefined) {
        return undefined;
    }
    return (done) => {
        action((error, stats) => {
            if (error !== null) {
                done(settings.throwErrorOnBrokenSymbolicLink ? error : null);
                return;
            }
            if (settings.stats) {
                entry.stats = stats;
            }
            if (settings.followSymbolicLinks) {
                entry.dirent = utils.fs.createDirentFromStats(entry.name, stats, directory);
            }
            done(null, entry);
        });
    };
}
function getStatsAction(entry, settings) {
    if (settings.stats) {
        return (callback) => {
            fsStat.stat(entry.path, settings.fsStatSettings, callback);
        };
    }
    if (settings.followSymbolicLinks && entry.dirent.isSymbolicLink()) {
        return (callback) => {
            settings.fs.stat(entry.path, callback);
        };
    }
    return undefined;
}
function callFailureCallback(callback, error) {
    callback(error);
}
function callSuccessCallback(callback, result) {
    callback(null, result);
}
