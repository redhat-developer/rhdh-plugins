import * as _swagger_api_apidom_core from '@swagger-api/apidom-core';
import { ParseResultElement } from '@swagger-api/apidom-core';
import { OpenAPIMediaTypes } from '@swagger-api/apidom-ns-openapi-3-1';

declare const jsonMediaTypes: OpenAPIMediaTypes;

declare const detectionRegExp: RegExp;
declare const detect: (source: string) => Promise<boolean>;
declare const parse: (source: string, options?: Record<string, unknown>) => Promise<ParseResultElement>;
declare const namespace: _swagger_api_apidom_core.Namespace;

export { detect, detectionRegExp, jsonMediaTypes as mediaTypes, namespace, parse };
