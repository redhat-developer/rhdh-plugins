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
  i18n?: {
    /**
     * Pseudolocalization stretches translated strings to test layout (i18next-pseudo).
     * @deepVisibility frontend
     */
    pseudolocalization?: {
      /**
       * When true, enables i18next-pseudo for strings that go through the translation API.
       * @visibility frontend
       */
      enabled?: boolean;
      /**
       * Language code to pseudolocalize (e.g. en, de). Defaults to the active UI language when omitted.
       * @visibility frontend
       */
      language?: string;
    };
  };
}
