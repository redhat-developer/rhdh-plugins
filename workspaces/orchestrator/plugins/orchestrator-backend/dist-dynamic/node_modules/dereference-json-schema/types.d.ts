import { JSONSchema4, JSONSchema4Type, JSONSchema6, JSONSchema6Type } from 'json-schema';
export type JSONSchema = Prettify<JSONSchema4 | JSONSchema6>;
export type JSONSchemaType = Prettify<JSONSchema4Type | JSONSchema6Type>;
export type DereferencedJSONSchema = Prettify<DeepOmit<JSONSchema, '$ref'>>;
type Prettify<T> = {
    [K in keyof T]: T[K];
};
type Primitive = string | Function | number | boolean | Symbol | undefined | null;
type DeepOmitArray<T extends any[], K> = {
    [P in keyof T]: DeepOmit<T[P], K>;
};
type DeepOmit<T, K> = T extends Primitive ? T : {
    [P in Exclude<keyof T, K>]: T[P] extends infer TP ? TP extends Primitive ? TP : TP extends any[] ? DeepOmitArray<TP, K> : DeepOmit<TP, K> : never;
};
export {};
