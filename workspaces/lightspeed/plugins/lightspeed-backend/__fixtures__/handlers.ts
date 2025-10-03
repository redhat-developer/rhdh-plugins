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

import { http, HttpResponse } from 'msw';

const localHostAndPort = 'localhost:443';
export const LOCAL_AI_ADDR = `http://${localHostAndPort}/v1`;

function loadTestFixture(filePathFromFixturesDir: string) {
  return require(`${__dirname}/${filePathFromFixturesDir}`);
}

export const handlers = [
  http.post(`${LOCAL_AI_ADDR}/chat/completions`, () => {
    const textEncoder = new TextEncoder();
    const mockData = loadTestFixture('chatResponse.json');

    const stream = new ReadableStream({
      start(controller) {
        mockData.forEach((chunk: any) => {
          controller.enqueue(
            textEncoder.encode(`data: ${JSON.stringify(chunk)}\n\n`),
          );
        });
        controller.close();
      },
    });

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }),

  // Catch-all handler for unknown paths
  http.all(`${LOCAL_AI_ADDR}/*`, ({ request }) => {
    console.log(`Caught request to unknown path: ${request.url}`);

    // Return a 404 response
    return new Response(
      JSON.stringify({
        error: 'Not found',
        message: `The requested resource at ${request.url} was not found`,
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }),
];
