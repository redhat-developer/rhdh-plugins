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
const fs = require('node:fs');
const path = require('node:path');

if (process.argv.length > 2) {
  throw new Error('patch-openapi-client.js does not accept arguments');
}

const generatedFile = path.join(__dirname, '../src/generated/client/common.ts');
const source = fs.readFileSync(generatedFile, 'utf8');
const unpatched = 'return axios.request<T, R>(axiosRequestArgs);';
const patched = 'return axios.request<T, R>(axiosRequestArgs) as Promise<R>;';
const matches = source.split(unpatched).length - 1;

if (matches === 0 && source.includes(patched)) {
  process.exit(0);
}
if (matches !== 1) {
  throw new Error(
    `Expected exactly one unpatched createRequestFunction return in ${generatedFile}`,
  );
}

fs.writeFileSync(generatedFile, source.replace(unpatched, patched));
