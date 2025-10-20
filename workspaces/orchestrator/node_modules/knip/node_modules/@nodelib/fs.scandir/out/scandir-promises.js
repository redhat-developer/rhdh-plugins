"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scandir = void 0;
const util = require("node:util");
const scandir_1 = require("./scandir");
exports.scandir = util.promisify(scandir_1.scandir);
