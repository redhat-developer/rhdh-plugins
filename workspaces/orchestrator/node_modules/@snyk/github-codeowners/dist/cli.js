#!/usr/bin/env node
"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const commander_1 = __importDefault(require("commander"));
const audit_1 = require("./commands/audit");
const who_1 = require("./commands/who");
const git_1 = require("./commands/git");
const logger_1 = require("./lib/logger");
const types_1 = require("./lib/types");
const validate_1 = require("./commands/validate");
const { version } = require('../package.json');
commander_1.default.version(version);
commander_1.default.command('audit')
    .description('list the owners for all files')
    .option('-d, --dir <dirPath>', 'path to VCS directory', process.cwd())
    .option('-c, --codeowners <filePath>', 'path to codeowners file (default: "<dir>/.github/CODEOWNERS")')
    .option('-o, --output <outputFormat>', `how to output format eg: ${Object.values(types_1.OUTPUT_FORMAT).join(', ')}`, types_1.OUTPUT_FORMAT.SIMPLE)
    .option('-u, --unloved', 'write unowned files only', false)
    .option('-g, --only-git', 'consider only files tracked by git', false)
    .option('-s, --stats', 'write output stats', false)
    .option('-r, --root <rootPath>', 'the root path to filter files by', '')
    .action(async (options) => {
    try {
        if (!options.codeowners) {
            options.codeowners = path.resolve(options.dir, '.github/CODEOWNERS');
        }
        if (options.root) {
            options.dir = path.resolve(options.dir, options.root);
        }
        await audit_1.audit(options);
    }
    catch (error) {
        logger_1.log.error('failed to run audit command', error);
        process.exit(1);
    }
});
commander_1.default.command('validate')
    .description('Validates a CODOWNER file and files in dir')
    .option('-d, --dir <dirPath>', 'path to VCS directory', process.cwd())
    .option('-c, --codeowners <filePath>', 'path to codeowners file (default: "<dir>/.github/CODEOWNERS")')
    .option('-r, --root <rootPath>', 'the root path to filter files by', '')
    .action(async (options) => {
    try {
        if (!options.codeowners) {
            options.codeowners = path.resolve(options.dir, '.github/CODEOWNERS');
        }
        if (options.root) {
            options.dir = path.resolve(options.dir, options.root);
        }
        await validate_1.validate(options);
    }
    catch (error) {
        logger_1.log.error('failed to run validate command', error);
        process.exit(1);
    }
});
commander_1.default.command('who <files...>')
    .description('lists owners of a specific file or files')
    .option('-d, --dir <dirPath>', 'path to VCS directory', process.cwd())
    .option('-c, --codeowners <filePath>', 'path to codeowners file (default: "<dir>/.github/CODEOWNERS")')
    .option('-o, --output <outputFormat>', `how to output format eg: ${Object.values(types_1.OUTPUT_FORMAT).join(', ')}`, types_1.OUTPUT_FORMAT.SIMPLE)
    .action(async (files, options) => {
    try {
        if (files.length < 1) {
            throw new Error('a file must be defined');
        }
        options.files = files;
        if (!options.codeowners) {
            options.codeowners = path.resolve(options.dir, '.github/CODEOWNERS');
        }
        await who_1.who(options);
    }
    catch (error) {
        logger_1.log.error('failed to run who command', error);
        process.exit(1);
    }
});
commander_1.default.command('git [shaA] [shaB]')
    .description('lists owners of files changed between commits, a commit against head or staged against head')
    .option('-d, --dir <dirPath>', 'path to VCS directory', process.cwd())
    .option('-c, --codeowners <filePath>', 'path to codeowners file (default: "<dir>/.github/CODEOWNERS")')
    .option('-o, --output <outputFormat>', `how to output format eg: ${Object.values(types_1.OUTPUT_FORMAT).join(', ')}`, types_1.OUTPUT_FORMAT.SIMPLE)
    .option('-s, --stats', 'output stats, note: line counts are not available for this command', false)
    .action(async (shaA, shaB, options) => {
    try {
        if (!options.codeowners) {
            options.codeowners = path.resolve(options.dir, '.github/CODEOWNERS');
        }
        options.shaA = shaA;
        options.shaB = shaB;
        await git_1.git(options);
    }
    catch (error) {
        logger_1.log.error('failed to run git command', error);
        process.exit(1);
    }
});
if (!process.argv.slice(2).length) {
    commander_1.default.outputHelp();
}
commander_1.default.parse(process.argv);
//# sourceMappingURL=cli.js.map