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

export const DOCKER_PROTO = 'docker://';
export const OCI_PROTO = 'oci://';
export const REF_PROTO = 'ref://';

export function isOciUrl(value: string): boolean {
  return value.startsWith(OCI_PROTO);
}

export function isDockerUrl(value: string): boolean {
  return value.startsWith(DOCKER_PROTO);
}

export function isHttpUrl(value: string): boolean {
  return value.startsWith('https://') || value.startsWith('http://');
}

export function isLocalPath(value: string): boolean {
  return value.startsWith('./');
}

export function isRefUrl(value: string): boolean {
  return value.startsWith(REF_PROTO);
}
