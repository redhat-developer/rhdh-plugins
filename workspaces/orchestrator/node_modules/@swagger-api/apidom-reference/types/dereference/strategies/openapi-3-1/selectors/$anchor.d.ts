import { Element } from '@swagger-api/apidom-core';
import EvaluationJsonSchema$anchorError from '../../../../errors/EvaluationJsonSchema$anchorError';
import InvalidJsonSchema$anchorError from '../../../../errors/InvalidJsonSchema$anchorError';
export declare const isAnchor: (uri: string) => boolean;
export declare const uriToAnchor: (uri: string) => string;
export declare const parse: (anchor: string) => string;
export declare const evaluate: <T extends Element>(anchor: string, element: T) => Element | undefined;
export { EvaluationJsonSchema$anchorError, InvalidJsonSchema$anchorError };
export { default as JsonSchema$anchorError } from '../../../../errors/JsonSchema$anchorError';
