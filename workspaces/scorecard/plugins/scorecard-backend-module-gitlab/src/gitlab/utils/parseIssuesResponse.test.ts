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
import { parseIssuesResponse } from './parseIssuesResponse';

describe('parseIssuesResponse', () => {
  const logger = mockServices.logger.mock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw when response shape is unexpected', () => {
    expect(() => parseIssuesResponse({ unexpected: true }, logger)).toThrow(
      'Unexpected response from GitLab Issues API',
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it('should throw when an issue item is not an object', () => {
    expect(() => parseIssuesResponse([null], logger)).toThrow(
      'Unexpected GitLab issue item: expected an object',
    );
  });

  it('should throw when closed_at is not a string or null', () => {
    expect(() => parseIssuesResponse([{ closed_at: 123 }], logger)).toThrow(
      'Unexpected GitLab issue item: closed_at must be a string or null',
    );
  });

  it('should map a plain array response without paginationInfo', () => {
    expect(
      parseIssuesResponse(
        [{ closed_at: '2024-01-02T00:00:00Z' }, { closed_at: null }],
        logger,
      ),
    ).toEqual({
      data: [{ closed_at: '2024-01-02T00:00:00Z' }, { closed_at: null }],
    });
  });

  it('should map an expanded response and keep a numeric total', () => {
    expect(
      parseIssuesResponse(
        {
          data: [{ closed_at: '2024-01-02T00:00:00Z' }],
          paginationInfo: { total: 7 },
        },
        logger,
      ),
    ).toEqual({
      data: [{ closed_at: '2024-01-02T00:00:00Z' }],
      paginationInfo: { total: 7 },
    });
  });

  it('should omit non-numeric pagination totals', () => {
    expect(
      parseIssuesResponse(
        {
          data: [{}],
          paginationInfo: { total: '7' },
        },
        logger,
      ),
    ).toEqual({
      data: [{ closed_at: undefined }],
      paginationInfo: { total: undefined },
    });
  });
});
