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
  lightspeed?: {
    prompts?: Array</**
     * @visibility frontend
     */
    {
      /**
       * The title of the prompt.
       * Displayed as the heading of the prompt.
       * @visibility frontend
       */
      title: string;
      /**
       * The main question or message shown in the prompt.
       * @visibility frontend
       */
      message: string;
    }>;
    /**
     * Configuration for AI Notebooks
     * @visibility frontend
     */
    notebooks?: {
      /**
       * Enable/disable AI Notebooks feature
       * When enabled, exposes AI Notebooks REST API endpoints for document-based conversations with RAG.
       * Requires Lightspeed service to be running (default: http://0.0.0.0:8080).
       * @default false
       * @visibility frontend
       */
      enabled: boolean;
      /**
       * Query configuration for notebooks
       * @visibility frontend
       */
      queryDefaults?: {
        /**
         * Model to use for answering queries
         * @visibility frontend
         */
        model: string;
        /**
         * AI provider for the query model
         * @visibility frontend
         */
        provider_id: string;
      };
    };
  };
}
