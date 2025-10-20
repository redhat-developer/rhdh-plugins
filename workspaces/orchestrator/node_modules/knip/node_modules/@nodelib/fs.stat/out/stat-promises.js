"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stat = void 0;
const util = require("node:util");
const stat_1 = require("./stat");
exports.stat = util.promisify(stat_1.stat);
