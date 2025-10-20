import { JsonValue } from '@backstage/types';

/** @public */
type TemplateFilter = (arg: JsonValue, ...rest: JsonValue[]) => JsonValue | undefined;
/** @public */
type TemplateGlobal = ((...args: JsonValue[]) => JsonValue | undefined) | JsonValue;

export type { TemplateFilter as T, TemplateGlobal as a };
