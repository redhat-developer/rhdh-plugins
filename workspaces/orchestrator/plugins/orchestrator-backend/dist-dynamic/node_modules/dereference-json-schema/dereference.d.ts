import type { DereferencedJSONSchema, JSONSchema } from './types';
/**
 * Resolves all $ref pointers in a schema and returns a new schema without any $ref pointers.
 */
export declare const dereferenceSync: (schema: JSONSchema) => DereferencedJSONSchema;
