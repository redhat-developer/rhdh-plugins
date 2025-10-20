"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultFilteredAdapter = exports.Filter = void 0;
const fileAdapter_1 = require("./fileAdapter");
const helper_1 = require("./helper");
const util_1 = require("../util");
class Filter {
    constructor() {
        this.g = [];
        this.p = [];
    }
}
exports.Filter = Filter;
class DefaultFilteredAdapter extends fileAdapter_1.FileAdapter {
    constructor(filePath) {
        super(filePath);
        this.filtered = false;
    }
    // loadPolicy loads all policy rules from the storage.
    async loadPolicy(model) {
        this.filtered = false;
        await super.loadPolicy(model);
    }
    async loadFilteredPolicy(model, filter) {
        if (!filter) {
            await this.loadPolicy(model);
            return;
        }
        if (!this.filePath) {
            throw new Error('invalid file path, file path cannot be empty');
        }
        await this.loadFilteredPolicyFile(model, filter, helper_1.Helper.loadPolicyLine);
        this.filtered = true;
    }
    async loadFilteredPolicyFile(model, filter, handler) {
        const bodyBuf = await util_1.readFile(this.filePath);
        const lines = bodyBuf.toString().split('\n');
        lines.forEach((n, index) => {
            const line = n;
            if (!line || DefaultFilteredAdapter.filterLine(line, filter)) {
                return;
            }
            handler(line, model);
        });
    }
    isFiltered() {
        return this.filtered;
    }
    async savePolicy(model) {
        if (this.filtered) {
            throw new Error('cannot save a filtered policy');
        }
        await super.savePolicy(model);
        return true;
    }
    static filterLine(line, filter) {
        if (!filter) {
            return false;
        }
        const p = line.split(',');
        if (p.length === 0) {
            return true;
        }
        let filterSlice = [];
        switch (p[0].trim()) {
            case 'p':
                filterSlice = filter.p;
                break;
            case 'g':
                filterSlice = filter.g;
                break;
        }
        return DefaultFilteredAdapter.filterWords(p, filterSlice);
    }
    static filterWords(line, filter) {
        if (line.length < filter.length + 1) {
            return true;
        }
        let skipLine = false;
        for (let i = 0; i < filter.length; i++) {
            if (filter[i] && filter[i] !== filter[i + 1]) {
                skipLine = true;
                break;
            }
        }
        return skipLine;
    }
}
exports.DefaultFilteredAdapter = DefaultFilteredAdapter;
