import { PerformanceObserver, performance } from 'node:perf_hooks';
import { constants } from 'node:perf_hooks';
import { memoryUsage } from 'node:process';
import EasyTable from 'easy-table';
import prettyMilliseconds from 'pretty-ms';
import Summary from 'summary';
import parsedArgValues from './cli-arguments.js';
import { debugLog } from './debug.js';
const { performance: isEnabled = false } = parsedArgValues;
export const timerify = (fn, name = fn.name) => {
    if (!isEnabled)
        return fn;
    return performance.timerify(Object.defineProperty(fn, 'name', { get: () => name }));
};
class Performance {
    isEnabled;
    startTime = 0;
    endTime = 0;
    entries = [];
    instanceId;
    fnObserver;
    gcObserver;
    memoryUsageStart;
    constructor(isEnabled) {
        if (isEnabled) {
            this.startTime = performance.now();
            this.instanceId = Math.floor(performance.now() * 100);
            this.fnObserver = new PerformanceObserver(items => {
                for (const entry of items.getEntries()) {
                    this.entries.push(entry);
                }
            });
            this.fnObserver.observe({ entryTypes: ['function'] });
            this.gcObserver = new PerformanceObserver(items => {
                for (const item of items.getEntries()) {
                    if (item.detail?.kind === constants.NODE_PERFORMANCE_GC_MAJOR) {
                        debugLog('*', `GC (after ${prettyMilliseconds(item.startTime)} in ${prettyMilliseconds(item.duration)})`);
                    }
                }
            });
            this.gcObserver.observe({ entryTypes: ['gc'] });
            this.memoryUsageStart = memoryUsage();
        }
        this.isEnabled = isEnabled;
    }
    setMark(name) {
        const id = `${this.instanceId}:${name}`;
        performance.mark(`${id}:start`);
    }
    clearMark(name) {
        const id = `${this.instanceId}:${name}`;
        performance.mark(`${id}:end`);
        performance.measure(id, `${id}:start`, `${id}:end`);
        performance.clearMarks(`${id}:start`);
        performance.clearMarks(`${id}:end`);
    }
    async flush() {
        this.setMark('_flush');
        await new Promise(resolve => setTimeout(resolve, 1));
        this.clearMark('_flush');
    }
    getEntriesByName() {
        return this.entries.reduce((entries, entry) => {
            const name = entry.name.replace(`${this.instanceId}:`, '');
            entries[name] = entries[name] ?? [];
            entries[name].push(entry.duration);
            return entries;
        }, {});
    }
    getTable() {
        const entriesByName = this.getEntriesByName();
        const table = new EasyTable();
        for (const [name, values] of Object.entries(entriesByName)) {
            const stats = new Summary(values);
            table.cell('Name', name);
            table.cell('size', stats.size(), EasyTable.number(0));
            table.cell('min', stats.min(), EasyTable.number(2));
            table.cell('max', stats.max(), EasyTable.number(2));
            table.cell('median', stats.median(), EasyTable.number(2));
            table.cell('sum', stats.sum(), EasyTable.number(2));
            table.newRow();
        }
        table.sort(['sum|des']);
        return table.toString().trim();
    }
    getCurrentDurationInMs(startTime) {
        return performance.now() - (startTime ?? this.startTime);
    }
    getMemHeapUsage() {
        return (memoryUsage().heapUsed ?? 0) - (this.memoryUsageStart?.heapUsed ?? 0);
    }
    getCurrentMemUsageInMb() {
        return Math.round((this.getMemHeapUsage() / 1024 / 1024) * 100) / 100;
    }
    async finalize() {
        if (!this.isEnabled)
            return;
        await this.flush();
    }
    reset() {
        this.entries = [];
        this.fnObserver?.disconnect();
    }
}
export const perfObserver = new Performance(isEnabled);
