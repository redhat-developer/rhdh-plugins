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

/**
 * Saved prompts configuration limits from LCORE GET /v1/saved-prompts/config.
 *
 * @public
 */
export interface SavedPromptsConfig {
  /** Maximum number of saved prompts allowed per user */
  max_prompts_per_user: number;
  /** Maximum character length for prompt display name */
  max_display_name_length: number;
  /** Maximum character length for prompt content body */
  max_content_length: number;
}

/**
 * A single saved prompt returned by LCORE.
 *
 * @public
 */
export interface SavedPrompt {
  /** Unique identifier of the saved prompt */
  id: string;
  /** Display name of the saved prompt */
  name: string;
  /** Prompt body text */
  content: string;
  /** Creation timestamp as an ISO datetime string from LCORE */
  created_at: string;
  /** Last-update timestamp as an ISO datetime string from LCORE */
  updated_at: string;
}

/**
 * Response body for GET /v1/saved-prompts.
 *
 * @public
 */
export interface SavedPromptsListResponse {
  /** Saved prompts for the authenticated user, newest first */
  prompts: SavedPrompt[];
}

/**
 * Request body for POST /v1/saved-prompts.
 *
 * @public
 */
export interface SavedPromptCreateRequest {
  /** Display name of the saved prompt */
  name: string;
  /** Prompt body text */
  content: string;
}

/**
 * Response body for DELETE /v1/saved-prompts/:prompt_id (HTTP 200).
 *
 * @public
 */
export interface SavedPromptDeleteResponse {
  /** Saved prompt identifier that was passed to delete */
  prompt_id: string;
  /** Whether the prompt was deleted successfully */
  deleted: boolean;
  /** Human-readable outcome of the delete operation */
  response: string;
}
