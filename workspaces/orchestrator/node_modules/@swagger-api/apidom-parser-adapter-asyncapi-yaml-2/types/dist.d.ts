import * as _swagger_api_apidom_core from '@swagger-api/apidom-core';
import { ParseResultElement } from '@swagger-api/apidom-core';
import { AsyncAPIMediaTypes } from '@swagger-api/apidom-ns-asyncapi-2';

declare const yamlMediaTypes: AsyncAPIMediaTypes;

declare const detectionRegExp: RegExp;
declare const detect: (source: string) => Promise<boolean>;
declare const parse: (source: string, options?: Record<string, unknown>) => Promise<ParseResultElement>;
declare const namespace: _swagger_api_apidom_core.Namespace;

export { detect, detectionRegExp, yamlMediaTypes as mediaTypes, namespace, parse };
