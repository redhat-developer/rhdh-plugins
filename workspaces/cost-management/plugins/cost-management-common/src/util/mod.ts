/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  type JsonValue,
  maybeJsonArray,
  maybeJsonObject,
  maybeJsonValue,
} from './lib/json';
import { JsonNode, type JsonNodeVisitorOptions } from './lib/json_node';

/**
 * Recursively transforms the keys of JSON objects within the input value using the provided function.
 *
 * @public
 * @param input - The input value to process. Must be a valid JSON value.
 * @param functionOrOptions - A function that can be used to change the keys in the provided input or a configuration object.
 * @throws \{TypeError\} If the input is not a valid JSON value.
 *
 * @returns The same value when the input is a JSON scalar, an empty array or empty object; otherwise a new reference value.
 */
export function deepMapKeys(
  input: unknown,
  functionOrOptions:
    | JsonNodeVisitorOptions
    | JsonNodeVisitorOptions['onVisitJsonObjectKey'],
): JsonValue {
  if (!maybeJsonValue(input)) {
    throw new TypeError('Invalid argument type');
  }

  if (
    (maybeJsonObject(input) && Object.keys(input).length === 0) ||
    (maybeJsonArray(input) && input.length === 0)
  ) {
    return input;
  }

  const node = new JsonNode('$', input);
  const visitor = new JsonNode.Visitor(
    typeof functionOrOptions === 'function'
      ? { onVisitJsonObjectKey: functionOrOptions }
      : functionOrOptions,
  );
  node.accept(visitor);

  return node.toJsonValue();
}
