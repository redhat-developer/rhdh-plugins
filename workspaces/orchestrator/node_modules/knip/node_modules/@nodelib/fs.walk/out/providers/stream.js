"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamProvider = void 0;
const node_stream_1 = require("node:stream");
class StreamProvider {
    #reader;
    #stream;
    constructor(reader) {
        this.#reader = reader;
        this.#stream = this.#createOutputStream();
    }
    read(root) {
        this.#reader.onError((error) => {
            this.#stream.emit('error', error);
        });
        this.#reader.onEntry((entry) => {
            this.#stream.push(entry);
        });
        this.#reader.onEnd(() => {
            this.#stream.push(null);
        });
        this.#reader.read(root);
        return this.#stream;
    }
    #createOutputStream() {
        return new node_stream_1.Readable({
            objectMode: true,
            read: () => { },
            destroy: (error, callback) => {
                if (!this.#reader.isDestroyed) {
                    this.#reader.destroy();
                }
                callback(error);
            },
        });
    }
}
exports.StreamProvider = StreamProvider;
