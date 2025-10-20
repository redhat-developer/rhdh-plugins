"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
// Sets up a full project which will ensure compliance against the following:
// - codenames spec https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/about-code-owners#codeowners-syntax)
// - gitignore spec https://git-scm.com/docs/gitignore
const paths = {
    files: path_1.default.resolve(__dirname, 'files.json'),
    codeowners: path_1.default.resolve(__dirname, 'owners'),
    gitignores: [
        {
            in: path_1.default.resolve(__dirname, 'gitignore'),
            out: '.gitignore',
        },
        {
            in: path_1.default.resolve(__dirname, 'gitignore-deep'),
            out: 'deep/nested-ignore/.gitignore',
        },
    ],
};
exports.default = paths;
//# sourceMappingURL=index.js.map