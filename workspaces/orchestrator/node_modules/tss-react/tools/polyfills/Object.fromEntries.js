"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectFromEntries = void 0;
exports.objectFromEntries = !Object
    .fromEntries
    ? (entries) => {
        if (!entries || !entries[Symbol.iterator]) {
            throw new Error("Object.fromEntries() requires a single iterable argument");
        }
        const o = {};
        Object.keys(entries).forEach(key => {
            const [k, v] = entries[key];
            o[k] = v;
        });
        return o;
    }
    : Object.fromEntries;
