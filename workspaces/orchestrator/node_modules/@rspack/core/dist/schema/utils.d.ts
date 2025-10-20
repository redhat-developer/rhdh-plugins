// @ts-ignore
import * as z from "zod/v4";
export declare const numberOrInfinity: z.ZodUnion<[z.ZodNumber, z.ZodLiteral<number>]>;
export declare const intOrInfinity: z.ZodUnion<[z.ZodInt, z.ZodLiteral<number>]>;
export declare const anyFunction: z.ZodCustom<(...args: unknown[]) => any, (...args: unknown[]) => any>;
