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
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { ResponsesApiClient } from './ResponsesApiClient';

/**
 * Category classification from the Moderations API.
 */
export interface ModerationCategory {
  name: string;
  flagged: boolean;
  score: number;
}

/**
 * Result from a single moderation input.
 */
export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores: Record<string, number>;
}

/**
 * Full response from `POST /v1/moderations`.
 */
export interface ModerationResponse {
  id: string;
  model: string;
  results: ModerationResult[];
}

/**
 * Service wrapping the Llama Stack `POST /v1/moderations` endpoint.
 *
 * Provides fine-grained content classification that supplements the
 * `SafetyService` shields. While shields enforce binary allow/block
 * decisions during response generation, the Moderations API returns
 * per-category scores enabling nuanced handling (logging, UI warnings,
 * conditional blocking based on score thresholds).
 *
 * Usage example:
 * ```ts
 * const result = await moderationService.moderate(client, {
 *   input: 'User message to classify',
 *   model: 'text-moderation-latest',
 * });
 * if (result.results[0]?.flagged) {
 *   // handle flagged content
 * }
 * ```
 */
export class ModerationService {
  constructor(private readonly logger: LoggerService) {}

  /**
   * Classify content using the Llama Stack Moderations API.
   *
   * @param client - Authenticated API client
   * @param options - Moderation request options
   * @returns Moderation response with per-category classifications
   */
  async moderate(
    client: ResponsesApiClient,
    options: {
      input: string | string[];
      model?: string;
    },
  ): Promise<ModerationResponse> {
    const body: Record<string, unknown> = {
      input: options.input,
    };
    if (options.model) {
      body.model = options.model;
    }

    this.logger.debug(
      `[ModerationService] Classifying ${Array.isArray(options.input) ? options.input.length : 1} input(s)`,
    );

    const response = await client.requestWithRetry<ModerationResponse>(
      '/v1/moderations',
      { method: 'POST', body: JSON.stringify(body) },
    );

    const flaggedCount = response.results.filter(r => r.flagged).length;
    if (flaggedCount > 0) {
      this.logger.info(
        `[ModerationService] ${flaggedCount}/${response.results.length} input(s) flagged`,
      );
    }

    return response;
  }

  /**
   * Convenience method to check if any input is flagged.
   */
  async isFlagged(
    client: ResponsesApiClient,
    input: string,
    model?: string,
  ): Promise<boolean> {
    try {
      const response = await this.moderate(client, { input, model });
      return response.results.some(r => r.flagged);
    } catch (error) {
      this.logger.warn(
        `[ModerationService] Moderation check failed, defaulting to not flagged: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }

  /**
   * Get detailed category scores for content classification.
   */
  async getScores(
    client: ResponsesApiClient,
    input: string,
    model?: string,
  ): Promise<Record<string, number>> {
    const response = await this.moderate(client, { input, model });
    return response.results[0]?.category_scores ?? {};
  }
}
