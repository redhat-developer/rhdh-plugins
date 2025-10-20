import * as fs from 'node:fs';
import type { Dirent } from '../types';
declare const kStats: unique symbol;
export declare function createDirentFromStats(name: string, stats: fs.Stats, parentPath: string): Dirent;
export declare class DirentFromStats extends fs.Dirent {
    private readonly [kStats];
    constructor(name: string, stats: fs.Stats, parentPath: string);
}
export {};
