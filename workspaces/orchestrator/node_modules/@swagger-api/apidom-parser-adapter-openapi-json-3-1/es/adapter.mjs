import { propOr, omit } from 'ramda';
import { isNotUndefined } from 'ramda-adjunct';
import { createNamespace } from '@swagger-api/apidom-core';
import { parse as parseJSON, detect as detectJSON } from '@swagger-api/apidom-parser-adapter-json';
import openApiNamespace, { OpenApi3_1Element } from '@swagger-api/apidom-ns-openapi-3-1';
export { default as mediaTypes } from "./media-types.mjs";
export const detectionRegExp = /"openapi"\s*:\s*"(?<version_json>3\.1\.(?:[1-9]\d*|0))"/;
export const detect = async source => detectionRegExp.test(source) && (await detectJSON(source));
export const parse = async (source, options = {}) => {
  const refractorOpts = propOr({}, 'refractorOpts', options);
  const parserOpts = omit(['refractorOpts'], options);
  const parseResultElement = await parseJSON(source, parserOpts);
  const {
    result
  } = parseResultElement;
  if (isNotUndefined(result)) {
    const openApiElement = OpenApi3_1Element.refract(result, refractorOpts);
    openApiElement.classes.push('result');
    parseResultElement.replaceResult(openApiElement);
  }
  return parseResultElement;
};
export const namespace = createNamespace(openApiNamespace);