"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncProvider = void 0;
class SyncProvider {
    #reader;
    constructor(reader) {
        this.#reader = reader;
    }
    read(root) {
        return this.#reader.read(root);
    }
}
exports.SyncProvider = SyncProvider;
