"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirentFromStats = void 0;
exports.createDirentFromStats = createDirentFromStats;
const fs = require("node:fs");
const kStats = Symbol('stats');
function createDirentFromStats(name, stats, parentPath) {
    return new DirentFromStats(name, stats, parentPath);
}
// Adapting an internal class in Node.js to mimic the behavior of `fs.Dirent` when creating it manually from `fs.Stats`.
// https://github.com/nodejs/node/blob/e92499c963155fc0accc14ad0a1d10158defa4cb/lib/internal/fs/utils.js#L196-L210
class DirentFromStats extends fs.Dirent {
    [kStats];
    constructor(name, stats, parentPath) {
        // @ts-expect-error The constructor has parameters, but they are not represented in types.
        // https://github.com/nodejs/node/blob/e92499c963155fc0accc14ad0a1d10158defa4cb/lib/internal/fs/utils.js#L197
        super(name, null, parentPath);
        this[kStats] = stats;
    }
}
exports.DirentFromStats = DirentFromStats;
for (const key of Reflect.ownKeys(fs.Dirent.prototype)) {
    const name = key;
    const descriptor = Object.getOwnPropertyDescriptor(fs.Dirent.prototype, name);
    if (descriptor?.writable === false || descriptor?.set === undefined) {
        continue;
    }
    DirentFromStats.prototype[name] = function () {
        return this[kStats][name]();
    };
}
