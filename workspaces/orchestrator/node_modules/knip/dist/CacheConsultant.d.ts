import { type FileDescriptor } from './util/file-entry-cache.js';
type CacheOptions = {
    name: string;
    isEnabled: boolean;
    cacheLocation: string;
};
export declare class CacheConsultant<T> {
    private isEnabled;
    private cache;
    constructor(options: CacheOptions);
    getFileDescriptor(file: string): FileDescriptor<T>;
    reconcile(): void;
}
export {};
