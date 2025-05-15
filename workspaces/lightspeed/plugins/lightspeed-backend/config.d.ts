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
  /**
   * Configuration required for using lightspeed
   * @visibility frontend
   */
  lightspeed: {
    servers: Array<{
      /**
       * The id of the server.
       * @visibility frontend
       */
      id: string;
      /**
       * The url of the server.
       * @visibility frontend
       */
      url: string;
      /**
       * The access token for authenticating server.
       * @visibility secret
       */
      token?: string;
    }>;
    /**
     * If turn on query restriction validation.
     * @visibility frontend
     */
    disableQuestionValidation?: boolean;
  };
}
