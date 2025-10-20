import type { FilterFunction, Settings } from '../settings';
import type { ErrnoException } from '../types';
export declare function isFatalError(settings: Settings, error: ErrnoException): boolean;
export declare function isAppliedFilter<T>(filter: FilterFunction<T> | null, value: T): boolean;
export declare function replacePathSegmentSeparator(filepath: string, separator: string): string;
export declare function joinPathSegments(a: string, b: string, separator: string): string;
