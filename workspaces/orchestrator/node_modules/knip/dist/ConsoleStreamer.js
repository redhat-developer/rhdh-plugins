export class ConsoleStreamer {
    isEnabled = false;
    lines = 0;
    constructor({ isEnabled = false }) {
        this.isEnabled = isEnabled;
    }
    clearLines(count) {
        if (count > 0) {
            for (let i = 0; i < count; i++) {
                process.stdout.moveCursor(0, -1);
                process.stdout.clearLine(1);
            }
        }
        process.stdout.cursorTo(0);
    }
    resetLines() {
        this.clearLines(this.lines);
    }
    update(messages) {
        this.resetLines();
        process.stdout.write(`${messages.join('\n')}\n`);
        this.lines = messages.length;
    }
    cast(message) {
        if (!this.isEnabled)
            return;
        if (Array.isArray(message))
            this.update(message);
        else
            this.update([message]);
    }
    clear() {
        if (!this.isEnabled)
            return;
        this.resetLines();
    }
}
