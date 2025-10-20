export declare class PackageJsonPeeker {
    private manifestStr;
    private lines;
    private sections;
    private ready;
    constructor(manifestStr: string);
    private init;
    getLocation(type: 'dependencies' | 'devDependencies' | 'optionalPeerDependencies', packageName: string): {
        line: number;
        col: number;
        pos: number;
    } | undefined;
}
