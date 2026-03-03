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

export type JsonScalar = number | string | boolean | null;

/** Asserts `value` is a JsonScalar */
export function isJsonScalar(value: unknown): value is JsonScalar {
  return (
    typeof value === 'number' ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    value === null
  );
}

/** A type representing a JSON object */
export type JsonObject = {
  [key in string]?: JsonValue;
};

/** Asserts non-recursively that `value` may be a JsonObject */
export function maybeJsonObject(value: unknown): value is JsonObject {
  return value?.constructor.name === 'Object';
}

/** A type representing JSON array */
export type JsonArray = Array<JsonValue>;

/** Asserts non-recursively that `value` may be a JsonArray */
export function maybeJsonArray(value: unknown): value is JsonArray {
  return Array.isArray(value);
}

/** A type representing all valid JSON serializable values. */
export type JsonValue = JsonObject | JsonArray | JsonScalar;

/** Asserts that `value` may be a JsonValue */
export function maybeJsonValue(value: unknown): value is JsonValue {
  return (
    typeof value !== 'undefined' &&
    (isJsonScalar(value) || maybeJsonObject(value) || maybeJsonArray(value))
  );
}
