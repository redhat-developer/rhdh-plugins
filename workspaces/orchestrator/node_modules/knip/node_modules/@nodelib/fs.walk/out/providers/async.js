"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncProvider = void 0;
class AsyncProvider {
    #reader;
    constructor(reader) {
        this.#reader = reader;
    }
    read(root, callback) {
        const entries = [];
        this.#reader.onError((error) => {
            callFailureCallback(callback, error);
        });
        this.#reader.onEntry((entry) => {
            entries.push(entry);
        });
        this.#reader.onEnd(() => {
            callSuccessCallback(callback, entries);
        });
        this.#reader.read(root);
    }
}
exports.AsyncProvider = AsyncProvider;
function callFailureCallback(callback, error) {
    callback(error);
}
function callSuccessCallback(callback, entries) {
    callback(null, entries);
}
