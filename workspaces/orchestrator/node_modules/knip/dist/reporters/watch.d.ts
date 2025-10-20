import type { ConsoleStreamer } from '../ConsoleStreamer.js';
import type { Issues, Report } from '../types/issues.js';
interface WatchReporter {
    report: Report;
    issues: Issues;
    streamer: ConsoleStreamer;
    startTime?: number;
    size: number;
    isDebug: boolean;
}
declare const _default: ({ report, issues, streamer, startTime, size, isDebug }: WatchReporter) => void;
export default _default;
