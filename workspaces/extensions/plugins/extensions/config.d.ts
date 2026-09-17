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
  extensions?: {
    /**
     * Metadata for catalog sources used to label and filter plugins by origin.
     * Keys correspond to the `extensions.backstage.io/catalog-source` annotation value.
     * @visibility frontend
     */
    catalogSources?: {
      [sourceKey: string]: {
        /**
         * Display label for this catalog source.
         * @visibility frontend
         */
        label: string;

        /**
         * Optional description shown as a tooltip.
         * @visibility frontend
         */
        description?: string;

        /**
         * Optional badge text shown on the plugin card in list view.
         * @visibility frontend
         */
        badge?: string;
      };
    };
  };
}
