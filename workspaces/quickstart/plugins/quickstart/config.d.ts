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
  app?: {
    /**
     * Configuration required for adding quickstarts
     * @visibility frontend
     */
    quickstart?: Array</**
     * @visibility frontend
     */
    {
      /**
       * The title of quickstart.
       * @visibility frontend
       */
      title: string;
      /**
       * The roles associated with the quickstart.
       * @visibility frontend
       */
      titleKey?: string;
      /**
       * The roles associated with the quickstart.
       * @visibility frontend
       */
      roles?: Array<string>;
      /**
       * Optional icon for quickstart.
       * @visibility frontend
       */
      icon?: string;
      /**
       * The description of quickstart.
       * @visibility frontend
       */
      description: string;
      /**
       * Optional action item for quickstart.
       * @visibility frontend
       */
      descriptionKey?: string;
      /**
       * Optional action item for quickstart.
       * @visibility frontend
       */
      cta?: {
        /**
         * Action item text.
         * @visibility frontend
         */
        text: string;
        /**
         * Action item link.
         * @visibility frontend
         */
        textKey?: string;
        /**
         * Action item link.
         * @visibility frontend
         */
        link: string;
      };
    }>;
  };
}
