// @ts-ignore
import type { z } from "zod/v4";
export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare function validate<T extends z.ZodType>(opts: any, createSchema: () => T, options?: {
    output?: boolean;
    strategy?: "strict" | "loose-unrecognized-keys" | "loose-silent" | "loose";
}): string | null;
export declare function isValidate<T extends z.ZodType>(opts: any, createSchema: () => T): boolean;
