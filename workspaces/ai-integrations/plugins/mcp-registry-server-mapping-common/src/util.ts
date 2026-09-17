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

/** Format a dot-separated object path for error messages, using `<root>` when empty. */
function formatObjectDotPath(objectDotPath: string): string {
  return objectDotPath.length > 0 ? objectDotPath : '<root>';
}

/**
 * Require that a present object property is a boolean.
 *
 * @internal
 */
export function requireBooleanProperty(
  obj: Record<string, unknown>,
  propertyName: string,
  objectDotPath: string,
): boolean {
  if (!Object.prototype.hasOwnProperty.call(obj, propertyName)) {
    throw new Error(
      `Missing required boolean property "${propertyName}" at "${formatObjectDotPath(
        objectDotPath,
      )}"`,
    );
  }
  const value = obj[propertyName];
  if (typeof value !== 'boolean') {
    throw new Error(
      `${propertyName} must be a boolean at "${formatObjectDotPath(
        objectDotPath,
      )}" (received ${typeof value})`,
    );
  }
  return value;
}
