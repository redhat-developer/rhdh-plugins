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

import { mockServices } from '@backstage/backend-test-utils';
import { parsePipelinesResponse } from './parsePipelinesResponse';

describe('parsePipelinesResponse', () => {
  const logger = mockServices.logger.mock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw when response shape is unexpected', () => {
    expect(() => parsePipelinesResponse({ unexpected: true }, logger)).toThrow(
      'Unexpected response from GitLab Pipelines API',
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it('should throw when a pipeline item is not an object', () => {
    expect(() => parsePipelinesResponse([null], logger)).toThrow(
      'Unexpected GitLab pipeline item: expected an object',
    );
  });

  it('should throw when started_at is not a string or null', () => {
    expect(() => parsePipelinesResponse([{ started_at: 123 }], logger)).toThrow(
      'Unexpected GitLab pipeline item: started_at must be a string or null',
    );
  });

  it('should throw when finished_at is not a string or null', () => {
    expect(() =>
      parsePipelinesResponse([{ finished_at: true }], logger),
    ).toThrow(
      'Unexpected GitLab pipeline item: finished_at must be a string or null',
    );
  });

  it('should throw when status is not a string', () => {
    expect(() => parsePipelinesResponse([{ status: 1 }], logger)).toThrow(
      'Unexpected GitLab pipeline item: status must be a string',
    );
  });

  it('should map a plain array response without paginationInfo', () => {
    expect(
      parsePipelinesResponse(
        [
          {
            started_at: '2024-01-02T00:00:00Z',
            finished_at: null,
            status: 'running',
          },
          {
            started_at: '2024-01-01T00:00:00Z',
            finished_at: '2024-01-01T01:00:00Z',
            status: 'success',
          },
        ],
        logger,
      ),
    ).toEqual({
      data: [
        {
          started_at: '2024-01-02T00:00:00Z',
          finished_at: null,
          status: 'running',
        },
        {
          started_at: '2024-01-01T00:00:00Z',
          finished_at: '2024-01-01T01:00:00Z',
          status: 'success',
        },
      ],
    });
  });

  it('should map an expanded response and keep a numeric total', () => {
    expect(
      parsePipelinesResponse(
        {
          data: [
            {
              started_at: '2024-01-02T00:00:00Z',
              finished_at: '2024-01-02T01:00:00Z',
              status: 'failed',
            },
          ],
          paginationInfo: { total: 5 },
        },
        logger,
      ),
    ).toEqual({
      data: [
        {
          started_at: '2024-01-02T00:00:00Z',
          finished_at: '2024-01-02T01:00:00Z',
          status: 'failed',
        },
      ],
      paginationInfo: { total: 5 },
    });
  });

  it('should omit non-numeric pagination totals', () => {
    expect(
      parsePipelinesResponse(
        {
          data: [{}],
          paginationInfo: { total: '5' },
        },
        logger,
      ),
    ).toEqual({
      data: [
        {
          started_at: undefined,
          finished_at: undefined,
          status: undefined,
        },
      ],
      paginationInfo: { total: undefined },
    });
  });
});
