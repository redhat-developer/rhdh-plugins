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

export const NO_LOG_STORAGE_URL = 'NO_LOG_STORAGE_URL';
export const NO_DATA_INDEX_URL = 'NO_DATA_INDEX_URL';
export const NO_BACKEND_EXEC_CTX = 'NO_BACKEND_EXEC_CTX';
export const NO_CLIENT_PROVIDED = 'NO_CLIENT_PROVIDED';
export const NO_LOGGER = 'NO_LOGGER';
export const SWF_BACKEND_NOT_INITED = 'SWF_BACKEND_NOT_INITED';

export class ErrorBuilder {
  public static NewBackendError(name: string, message: string): Error {
    const e = new Error(message);
    e.name = name;
    return e;
  }

  public static GET_NO_LOG_STORAGE_URL_ERR(): Error {
    return this.NewBackendError(
      NO_LOG_STORAGE_URL,
      'No log storage url specified or found',
    );
  }

  public static GET_NO_DATA_INDEX_URL_ERR(): Error {
    return this.NewBackendError(
      NO_DATA_INDEX_URL,
      'No data index url specified or found',
    );
  }

  public static GET_NO_CLIENT_PROVIDED_ERR(): Error {
    return this.NewBackendError(
      NO_CLIENT_PROVIDED,
      'No or null graphql client',
    );
  }

  public static GET_SWF_BACKEND_NOT_INITED(): Error {
    return this.NewBackendError(
      SWF_BACKEND_NOT_INITED,
      'The SonataFlow backend is not initialized, call initialize() method before trying to get the workflows.',
    );
  }
}
