"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const countLines_1 = require("./countLines");
const types_1 = require("../types");
class File {
    constructor(props) {
        this.path = props.path;
        this.owners = props.owners;
        this._lines = props.lines;
    }
    get lines() {
        return this._lines;
    }
    async updateLineCount() {
        this._lines = await countLines_1.countLines(this.path);
        return this._lines;
    }
    toJsonl() {
        return `${JSON.stringify({ path: this.path, owners: this.owners, lines: this.lines })}\n`;
    }
    toCsv() {
        let line = this.path;
        if (this.owners.length > 0) {
            line += `,${this.owners.join(',')}`;
        }
        return `${line}\n`;
    }
    toTsv() {
        let line = this.path;
        if (this.owners.length > 0) {
            line += `\t${this.owners.join('\t')}`;
        }
        return `${line}\n`;
    }
    write(output, stream) {
        switch (output) {
            case (types_1.OUTPUT_FORMAT.JSONL):
                stream.write(this.toJsonl());
                break;
            case (types_1.OUTPUT_FORMAT.CSV):
                stream.write(this.toCsv());
                break;
            default:
                stream.write(this.toTsv());
                break;
        }
    }
}
exports.File = File;
//# sourceMappingURL=File.js.map