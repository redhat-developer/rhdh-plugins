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
  bulkImport?: {
    /**
     * The name of the API used for bulk import operations.
     *
     * `open-pull-requests`:  Uses the Open Pull Requests API to create pull requests for each repository.
     *  This is the default option
     *
     * `scaffolder`: Uses the Scaffolder API to create import jobs.  This option is useful when you need to
     *  customize the import process or integrate it with other Scaffolder actions.
     * @visibility frontend
     */
    importAPI?: 'open-pull-requests' | 'scaffolder';

    /**
     * The name of the scaffolder template to execute for importing a repository.
     * @visibility backend
     */
    importTemplate?: string;

    /**
     * Whether to show the instructions section
     * @default true
     * @visibility frontend
     */
    instructionsEnabled?: boolean;

    /**
     * Whether the section should be expanded by default
     * @default true
     * @visibility frontend
     */
    instructionsDefaultExpanded?: boolean;

    /**
     * Array of steps to display in the instructions section
     * If not provided, uses the default built-in steps
     * Users can define any number of custom steps
     * @visibility frontend
     * @deepVisibility frontend
     */
    instructionsSteps?: Array<{
      /**
       * Unique identifier for the step
       * @visibility frontend
       */
      id: string;

      /**
       * Display text for the step
       * @visibility frontend
       */
      text: string;

      /**
       * Icon configuration - supports multiple formats:
       * - Backstage system icons: 'kind:component', 'kind:api', etc.
       * - Material Design icons: 'settings', 'home', 'build', etc.
       * - SVG strings: '<svg xmlns="http://www.w3.org/2000/svg">...</svg>'
       * - URLs: 'https://example.com/icon.png', '/assets/icon.svg'
       * - Data URIs: 'data:image/svg+xml;base64,...'
       * @visibility frontend
       */
      icon?: string;
    }>;
  };
}
