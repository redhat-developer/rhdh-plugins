import { Element } from '@swagger-api/apidom-core';
import EvaluationJsonSchemaUriError from '../../../../errors/EvaluationJsonSchemaUriError';
/**
 * Evaluates JSON Schema $ref containing unknown URI against ApiDOM fragment.
 */
export declare const evaluate: {
    <T extends Element>(uri: string, element: T): Element | undefined;
    cache: WeakMap<WeakKey, any>;
};
export { EvaluationJsonSchemaUriError };
export { default as JsonSchemaUriError } from '../../../../errors/JsonSchemaUriError';
