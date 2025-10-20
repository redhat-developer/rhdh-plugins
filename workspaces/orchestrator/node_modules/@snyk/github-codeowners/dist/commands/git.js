"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const ownership_1 = require("../lib/ownership");
const stats_1 = require("../lib/stats");
exports.git = async (options) => {
    const gitCommand = calcGitCommand(options);
    const diff = child_process_1.execSync(gitCommand).toString();
    const changedPaths = diff.split('\n').filter(path => path.length > 0);
    const files = await ownership_1.getOwnership(options.codeowners, changedPaths);
    for (const file of files) {
        file.write(options.output, process.stdout);
    }
    if (options.stats) {
        const stats = stats_1.calcFileStats(files);
        stats_1.statsWriter(stats, options, process.stdout);
    }
};
const calcGitCommand = (options) => {
    if (options.shaA && options.shaB) {
        return `git diff --name-only ${options.shaA} ${options.shaB}`;
    }
    if (options.shaA) {
        return `git ls-tree --full-tree -r --name-only ${options.shaA}`;
    }
    return 'git diff --name-only --cached HEAD';
};
//# sourceMappingURL=git.js.map