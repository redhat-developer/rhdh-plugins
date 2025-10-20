import { timerify } from './util/Performance.js';
import { FileEntryCache } from './util/file-entry-cache.js';
import { version } from './version.js';
const dummyFileDescriptor = { key: '', changed: true, notFound: true };
export class CacheConsultant {
    isEnabled;
    cache;
    constructor(options) {
        this.isEnabled = options.isEnabled;
        if (this.isEnabled) {
            const cacheName = `${options.name.replace(/[^a-z0-9]/g, '-').replace(/-*$/, '')}-${version}`;
            this.cache = new FileEntryCache(cacheName, options.cacheLocation);
            this.reconcile = timerify(this.cache.reconcile).bind(this.cache);
            this.getFileDescriptor = timerify(this.cache.getFileDescriptor).bind(this.cache);
        }
    }
    getFileDescriptor(file) {
        if (this.isEnabled && this.cache)
            return this.cache.getFileDescriptor(file);
        return dummyFileDescriptor;
    }
    reconcile() {
        if (this.isEnabled && this.cache)
            this.cache.reconcile();
    }
}
