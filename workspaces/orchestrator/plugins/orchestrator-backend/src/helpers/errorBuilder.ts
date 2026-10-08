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

export const NO_DATA_INDEX_URL = 'NO_DATA_INDEX_URL';

export class ErrorBuilder {
  public static NewBackendError(name: string, message: string): Error {
    const e = new Error(message);
    e.name = name;
    return e;
  }

  public static GET_NO_DATA_INDEX_URL_ERR(): Error {
    return this.NewBackendError(
      NO_DATA_INDEX_URL,
      'No data index url specified or found',
    );
  }
}
