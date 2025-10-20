export declare class ConsoleStreamer {
    isEnabled: boolean;
    private lines;
    constructor({ isEnabled }: {
        isEnabled?: boolean | undefined;
    });
    private clearLines;
    private resetLines;
    private update;
    cast(message: string | string[]): void;
    clear(): void;
}
