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
import { parseJobsResponse } from './parseJobsResponse';

describe('parseJobsResponse', () => {
  const logger = mockServices.logger.mock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw when response shape is unexpected', () => {
    expect(() => parseJobsResponse({ unexpected: true }, logger)).toThrow(
      'Unexpected response from GitLab Jobs API',
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it('should throw when a job item is not an object', () => {
    expect(() => parseJobsResponse([null], logger)).toThrow(
      'Unexpected GitLab job item: expected an object',
    );
  });

  it('should throw when created_at is missing', () => {
    expect(() => parseJobsResponse([{}], logger)).toThrow(
      'Unexpected GitLab job item: created_at must be a string',
    );
  });

  it('should throw when started_at is not a string or null', () => {
    expect(() =>
      parseJobsResponse(
        [{ created_at: '2024-01-01T00:00:00Z', started_at: 1 }],
        logger,
      ),
    ).toThrow(
      'Unexpected GitLab job item: started_at must be a string or null',
    );
  });

  it('should throw when finished_at is not a string or null', () => {
    expect(() =>
      parseJobsResponse(
        [{ created_at: '2024-01-01T00:00:00Z', finished_at: true }],
        logger,
      ),
    ).toThrow(
      'Unexpected GitLab job item: finished_at must be a string or null',
    );
  });

  it('should throw when status is not a string', () => {
    expect(() =>
      parseJobsResponse(
        [{ created_at: '2024-01-01T00:00:00Z', status: 1 }],
        logger,
      ),
    ).toThrow('Unexpected GitLab job item: status must be a string');
  });

  it('should map a plain array response without paginationInfo', () => {
    expect(
      parseJobsResponse(
        [
          {
            created_at: '2024-01-02T00:00:00Z',
            started_at: '2024-01-02T00:01:00Z',
            finished_at: null,
            status: 'running',
          },
          {
            created_at: '2024-01-01T00:00:00Z',
            started_at: '2024-01-01T00:01:00Z',
            finished_at: '2024-01-01T01:00:00Z',
            status: 'success',
          },
        ],
        logger,
      ),
    ).toEqual({
      data: [
        {
          created_at: '2024-01-02T00:00:00Z',
          started_at: '2024-01-02T00:01:00Z',
          finished_at: null,
          status: 'running',
        },
        {
          created_at: '2024-01-01T00:00:00Z',
          started_at: '2024-01-01T00:01:00Z',
          finished_at: '2024-01-01T01:00:00Z',
          status: 'success',
        },
      ],
    });
  });

  it('should map an expanded response and keep a numeric total', () => {
    expect(
      parseJobsResponse(
        {
          data: [
            {
              created_at: '2024-01-02T00:00:00Z',
              started_at: '2024-01-02T00:01:00Z',
              finished_at: '2024-01-02T01:00:00Z',
              status: 'failed',
            },
          ],
          paginationInfo: { total: 4 },
        },
        logger,
      ),
    ).toEqual({
      data: [
        {
          created_at: '2024-01-02T00:00:00Z',
          started_at: '2024-01-02T00:01:00Z',
          finished_at: '2024-01-02T01:00:00Z',
          status: 'failed',
        },
      ],
      paginationInfo: { total: 4 },
    });
  });

  it('should omit non-numeric pagination totals', () => {
    expect(
      parseJobsResponse(
        {
          data: [{ created_at: '2024-01-01T00:00:00Z' }],
          paginationInfo: { total: '4' },
        },
        logger,
      ),
    ).toEqual({
      data: [
        {
          created_at: '2024-01-01T00:00:00Z',
          started_at: undefined,
          finished_at: undefined,
          status: undefined,
        },
      ],
      paginationInfo: { total: undefined },
    });
  });
});
