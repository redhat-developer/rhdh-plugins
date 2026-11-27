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
import { parseMergeRequestsResponse } from './parseMergeRequestsResponse';

describe('parseMergeRequestsResponse', () => {
  const logger = mockServices.logger.mock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw when response shape is unexpected', () => {
    expect(() =>
      parseMergeRequestsResponse({ unexpected: true }, logger),
    ).toThrow('Unexpected response from GitLab Merge Requests API');
    expect(logger.error).toHaveBeenCalledWith(
      `Unexpected response from GitLab Merge Requests API: {"unexpected":true}`,
    );
  });

  it('should throw when a merge request item is not an object', () => {
    expect(() => parseMergeRequestsResponse(['bad'], logger)).toThrow(
      'Unexpected GitLab merge request item: expected an object',
    );
  });

  it('should throw when closed_at is not a string or null', () => {
    expect(() =>
      parseMergeRequestsResponse([{ closed_at: 1 }], logger),
    ).toThrow(
      'Unexpected GitLab merge request item: closed_at must be a string or null',
    );
  });

  it('should throw when merged_at is not a string or null', () => {
    expect(() =>
      parseMergeRequestsResponse([{ merged_at: true }], logger),
    ).toThrow(
      'Unexpected GitLab merge request item: merged_at must be a string or null',
    );
  });

  it('should map a plain array response without paginationInfo', () => {
    expect(
      parseMergeRequestsResponse(
        [
          {
            closed_at: '2024-01-02T00:00:00Z',
            merged_at: null,
          },
          {
            closed_at: null,
            merged_at: '2024-01-03T00:00:00Z',
          },
        ],
        logger,
      ),
    ).toEqual({
      data: [
        {
          closed_at: '2024-01-02T00:00:00Z',
          merged_at: null,
        },
        {
          closed_at: null,
          merged_at: '2024-01-03T00:00:00Z',
        },
      ],
    });
  });

  it('should map an expanded response and keep a numeric total', () => {
    expect(
      parseMergeRequestsResponse(
        {
          data: [{ closed_at: null, merged_at: '2024-01-03T00:00:00Z' }],
          paginationInfo: { total: 3 },
        },
        logger,
      ),
    ).toEqual({
      data: [{ closed_at: null, merged_at: '2024-01-03T00:00:00Z' }],
      paginationInfo: { total: 3 },
    });
  });

  it('should omit non-numeric pagination totals', () => {
    expect(
      parseMergeRequestsResponse(
        {
          data: [{}],
          paginationInfo: { total: '3' },
        },
        logger,
      ),
    ).toEqual({
      data: [{ closed_at: undefined, merged_at: undefined }],
      paginationInfo: { total: undefined },
    });
  });
});
