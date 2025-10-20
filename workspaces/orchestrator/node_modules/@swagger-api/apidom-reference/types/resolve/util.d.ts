import File from '../File';
import type { ReferenceOptions } from '../options';
/**
 * Reads the given file, using the configured resolver plugins.
 */
export declare const readFile: (file: File, options: ReferenceOptions) => Promise<Buffer>;
