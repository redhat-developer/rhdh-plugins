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

import type { Entity } from '@backstage/catalog-model';

import { OpenSSFResponse } from './types';

export class OpenSSFClient {
  async getScorecard(entity: Entity): Promise<OpenSSFResponse> {
    const scorecardUrl =
      entity.metadata.annotations?.['openssf/scorecardUrl'] ?? '';
    if (
      !scorecardUrl ||
      scorecardUrl.trim() === '' ||
      !scorecardUrl.startsWith('https://')
    ) {
      throw new Error(`Invalid annotation 'openssf/scorecardUrl' value`);
    }

    const response = await fetch(scorecardUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `OpenSSF API request failed with status ${response.status}: ${response.statusText}`,
      );
    }

    const data: OpenSSFResponse = await response.json();

    return data;
  }
}
