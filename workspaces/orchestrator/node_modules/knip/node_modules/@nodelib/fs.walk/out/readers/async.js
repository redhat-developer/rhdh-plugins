"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncReader = void 0;
const node_events_1 = require("node:events");
const fastq = require("fastq");
const common = require("./common");
class AsyncReaderEmitter {
    #emitter = new node_events_1.EventEmitter();
    onEntry(callback) {
        this.#emitter.on('entry', callback);
    }
    onError(callback) {
        this.#emitter.once('error', callback);
    }
    onEnd(callback) {
        this.#emitter.once('end', callback);
    }
    _emitEntry(entry) {
        this.#emitter.emit('entry', entry);
    }
    _emitEnd() {
        this.#emitter.emit('end');
    }
    _emitError(error) {
        this.#emitter.emit('error', error);
    }
}
class AsyncReader extends AsyncReaderEmitter {
    #isFatalError = false;
    #isDestroyed = false;
    #fs;
    #settings;
    #queue;
    constructor(fs, settings) {
        super();
        const queue = fastq(this.#worker.bind(this), settings.concurrency);
        queue.drain = () => {
            if (!this.#isFatalError) {
                this._emitEnd();
            }
        };
        this.#fs = fs;
        this.#settings = settings;
        this.#queue = queue;
    }
    read(root) {
        this.#isFatalError = false;
        this.#isDestroyed = false;
        this.#attachAbortSignal();
        const directory = common.replacePathSegmentSeparator(root, this.#settings.pathSegmentSeparator);
        this.#pushToQueue(directory, this.#settings.basePath);
    }
    get isDestroyed() {
        return this.#isDestroyed;
    }
    destroy() {
        if (this.#isDestroyed) {
            return;
        }
        this.#isDestroyed = true;
        this.#queue.killAndDrain();
    }
    #attachAbortSignal() {
        const signal = this.#settings.signal;
        if (signal?.aborted === true) {
            this.#handleError(signal.reason);
        }
        signal?.addEventListener('abort', () => {
            this.#handleError(signal.reason);
        }, { once: true });
    }
    #pushToQueue(directory, base) {
        this.#queue.push({ directory, base }, (error) => {
            if (error !== null) {
                this.#handleError(error);
            }
        });
    }
    #worker(item, done) {
        this.#fs.scandir(item.directory, this.#settings.fsScandirSettings, (error, entries) => {
            if (error !== null) {
                done(error, undefined);
                return;
            }
            /**
             * The user can define their own custom filtering and error handling functions.
             * If the user throws an error, we need to catch it and emit it to the user error handler.
             *
             * Without this, the error will be thrown immediately bypassing the error handler.
             */
            try {
                for (const entry of entries) {
                    this.#handleEntry(entry, item.base);
                }
            }
            catch (error) {
                done(error, undefined);
                return;
            }
            done(null, undefined);
        });
    }
    #handleError(error) {
        if (this.#isDestroyed || !common.isFatalError(this.#settings, error)) {
            return;
        }
        this.#isFatalError = true;
        this.#isDestroyed = true;
        this._emitError(error);
    }
    #handleEntry(entry, base) {
        if (this.#isDestroyed || this.#isFatalError) {
            return;
        }
        const fullpath = entry.path;
        if (base !== undefined) {
            entry.path = common.joinPathSegments(base, entry.name, this.#settings.pathSegmentSeparator);
        }
        if (common.isAppliedFilter(this.#settings.entryFilter, entry)) {
            this._emitEntry(entry);
        }
        if (entry.dirent.isDirectory() && common.isAppliedFilter(this.#settings.deepFilter, entry)) {
            this.#pushToQueue(fullpath, base === undefined ? undefined : entry.path);
        }
    }
}
exports.AsyncReader = AsyncReader;
