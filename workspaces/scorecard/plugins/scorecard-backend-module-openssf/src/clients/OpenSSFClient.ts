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

import { OpenSSFResponse } from './types';

export class OpenSSFClient {
  private readonly OPENSSF_API_BASE_URL =
    'https://api.securityscorecards.dev/projects';

  async getScorecard(owner: string, repo: string): Promise<OpenSSFResponse> {
    const apiUrl = `${this.OPENSSF_API_BASE_URL}/github.com/${owner}/${repo}`;

    const response = await fetch(apiUrl, {
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

    if (typeof data.score !== 'number') {
      throw new Error(
        `Invalid response from OpenSSF API: score is not a number`,
      );
    }

    return data;
  }
}
