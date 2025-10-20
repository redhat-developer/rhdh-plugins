"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../types");
exports.writer = (stats, options, stream) => {
    const orderedOwners = [...stats.owners].sort((a, b) => {
        if (a.owner < b.owner)
            return -1;
        if (a.owner > b.owner)
            return 1;
        return 0;
    });
    switch (options.output) {
        case (types_1.OUTPUT_FORMAT.JSONL):
            stream.write(`${JSON.stringify(stats)}\n`);
            break;
        case (types_1.OUTPUT_FORMAT.CSV):
            stream.write(`owner,files,lines,percentage\n`);
            stream.write(`total,${stats.total.files},${stats.total.lines},${stats.total.percentage}\n`);
            stream.write(`loved,${stats.loved.files},${stats.loved.lines},${stats.loved.percentage}\n`);
            stream.write(`unloved,${stats.unloved.files},${stats.unloved.lines},${stats.unloved.percentage}\n`);
            orderedOwners.forEach((owner) => {
                stream.write(`${owner.owner},${owner.counters.files},${owner.counters.lines},${owner.counters.percentage}\n`);
            });
            break;
        default:
            stream.write('\n--- Counts ---\n');
            stream.write(`Total: ${stats.total.files} files (${stats.total.lines} lines) ${stats.total.percentage}%\n`);
            stream.write(`Loved: ${stats.loved.files} files (${stats.loved.lines} lines) ${stats.loved.percentage}%\n`);
            stream.write(`Unloved: ${stats.unloved.files} files (${stats.unloved.lines} lines ${stats.unloved.percentage}%\n`);
            stream.write('--- Owners ---\n');
            const owners = orderedOwners.map(owner => `${owner.owner}: ${owner.counters.files} files (${owner.counters.lines} lines) ${owner.counters.percentage}%`).join('\n');
            stream.write(`${owners}\n`);
            break;
    }
};
//# sourceMappingURL=writer.js.map