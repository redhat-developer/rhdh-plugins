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

export interface Config {
  /** Optional configurations for the Codecov plugin */
  codecov?: {
    /**
     * The default account name to use when the codecov.io/account annotation is not set.
     * Defaults to "default".
     * @visibility frontend
     */
    defaultAccount?: string;

    /**
     * The list of codecov accounts.
     */
    accounts?: Array<{
      /**
       * The name of the codecov account.
       * @visibility frontend
       */
      name: string;

      /**
       * The auth token for the codecov account. Optional for public repositories.
       * @visibility secret
       */
      authToken?: string;
    }>;
  };
}
