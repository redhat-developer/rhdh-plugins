export interface Watcher {
    setUpdateCallback(cb: () => void): void;
    update(): Promise<boolean>;
}
