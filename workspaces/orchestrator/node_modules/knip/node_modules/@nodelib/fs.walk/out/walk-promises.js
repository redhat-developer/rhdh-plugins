"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walk = void 0;
const util = require("node:util");
const walk_1 = require("./walk");
exports.walk = util.promisify(walk_1.walk);
