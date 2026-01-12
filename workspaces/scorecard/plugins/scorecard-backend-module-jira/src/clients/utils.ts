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

export function validateJQLValue(value: string, fieldName: string): string {
  if (!/^[a-zA-Z0-9 _-]+$/.test(value)) {
    throw new Error(
      `${fieldName} contains invalid characters. Only alphanumeric, hyphens, spaces, and underscores are allowed.`,
    );
  }
  return value;
}

export function validateIdentifier(value: string, fieldName: string): string {
  if (!/^[a-zA-Z0-9-]+$/.test(value)) {
    throw new Error(
      `${fieldName} contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed.`,
    );
  }
  return value;
}

export function sanitizeValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
