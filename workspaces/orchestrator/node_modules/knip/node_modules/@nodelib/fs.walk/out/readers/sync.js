"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncReader = void 0;
const common = require("./common");
class SyncReader {
    #fs;
    #settings;
    #queue = new Set();
    #storage = [];
    constructor(fs, settings) {
        this.#fs = fs;
        this.#settings = settings;
    }
    read(root) {
        const directory = common.replacePathSegmentSeparator(root, this.#settings.pathSegmentSeparator);
        this.#pushToQueue(directory, this.#settings.basePath);
        this.#handleQueue();
        return this.#storage;
    }
    #pushToQueue(directory, base) {
        this.#queue.add({ directory, base });
    }
    #handleQueue() {
        for (const item of this.#queue.values()) {
            this.#handleDirectory(item.directory, item.base);
        }
    }
    #handleDirectory(directory, base) {
        try {
            const entries = this.#fs.scandirSync(directory, this.#settings.fsScandirSettings);
            for (const entry of entries) {
                this.#handleEntry(entry, base);
            }
        }
        catch (error) {
            this.#handleError(error);
        }
    }
    #handleError(error) {
        if (common.isFatalError(this.#settings, error)) {
            throw error;
        }
    }
    #handleEntry(entry, base) {
        const fullpath = entry.path;
        if (base !== undefined) {
            entry.path = common.joinPathSegments(base, entry.name, this.#settings.pathSegmentSeparator);
        }
        if (common.isAppliedFilter(this.#settings.entryFilter, entry)) {
            this.#pushToStorage(entry);
        }
        if (entry.dirent.isDirectory() && common.isAppliedFilter(this.#settings.deepFilter, entry)) {
            this.#pushToQueue(fullpath, base === undefined ? undefined : entry.path);
        }
    }
    #pushToStorage(entry) {
        this.#storage.push(entry);
    }
}
exports.SyncReader = SyncReader;
