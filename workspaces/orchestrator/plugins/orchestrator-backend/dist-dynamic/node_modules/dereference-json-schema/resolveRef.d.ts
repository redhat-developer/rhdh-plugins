import { JSONSchema } from './types';
/**
 * Resolves a $ref pointer in a schema and returns the referenced value.
 */
export declare const resolveRefSync: (schema: JSONSchema, ref: string) => unknown;
