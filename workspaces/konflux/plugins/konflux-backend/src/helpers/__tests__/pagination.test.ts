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

import {
  encodeContinuationToken,
  decodeContinuationToken,
  PaginationState,
} from '../pagination';

describe('pagination', () => {
  describe('encodeContinuationToken', () => {
    it('should encode pagination state with userId', () => {
      const state: PaginationState = {
        'cluster1-namespace1': {
          k8sToken: 'k8s-token-123',
        },
      };
      const userId = 'user@example.com';

      const token = encodeContinuationToken(state, userId);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      // Should be base64 encoded
      expect(() => Buffer.from(token, 'base64')).not.toThrow();
    });

    it('should encode state with multiple sources', () => {
      const state: PaginationState = {
        'cluster1-namespace1': {
          k8sToken: 'k8s-token-123',
          kubearchiveToken: 'kubearchive-token-456',
        },
        'cluster2-namespace2': {
          k8sToken: 'k8s-token-789',
        },
      };
      const userId = 'user@example.com';

      const token = encodeContinuationToken(state, userId);

      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      expect(decoded.userId).toBe(userId);
      expect(decoded.state).toEqual(state);
    });

    it('should encode state with only k8sToken', () => {
      const state: PaginationState = {
        'cluster1-namespace1': {
          k8sToken: 'k8s-token-123',
        },
      };
      const userId = 'user@example.com';

      const token = encodeContinuationToken(state, userId);

      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      expect(decoded.state['cluster1-namespace1'].k8sToken).toBe(
        'k8s-token-123',
      );
      expect(
        decoded.state['cluster1-namespace1'].kubearchiveToken,
      ).toBeUndefined();
    });

    it('should encode state with only kubearchiveToken', () => {
      const state: PaginationState = {
        'cluster1-namespace1': {
          kubearchiveToken: 'kubearchive-token-456',
        },
      };
      const userId = 'user@example.com';

      const token = encodeContinuationToken(state, userId);

      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
      expect(decoded.state['cluster1-namespace1'].kubearchiveToken).toBe(
        'kubearchive-token-456',
      );
      expect(decoded.state['cluster1-namespace1'].k8sToken).toBeUndefined();
    });

    it('should encode with different userId formats', () => {
      const state: PaginationState = {
        'cluster1-namespace1': {
          k8sToken: 'k8s-token-123',
        },
      };

      const userIds = [
        'user@example.com',
        'user:default/user',
        'user123',
        'user.name@domain.co.uk',
      ];

      userIds.forEach(userId => {
        const token = encodeContinuationToken(state, userId);
        const decoded = JSON.parse(
          Buffer.from(token, 'base64').toString('utf8'),
        );
        expect(decoded.userId).toBe(userId);
      });
    });
  });

  describe('decodeContinuationToken', () => {
    it('should decode valid continuation token', () => {
      const state: PaginationState = {
        'cluster1-namespace1': {
          k8sToken: 'k8s-token-123',
          kubearchiveToken: 'kubearchive-token-456',
        },
      };
      const userId = 'user@example.com';
      const token = encodeContinuationToken(state, userId);

      const decoded = decodeContinuationToken(token, userId);

      expect(decoded).toEqual(state);
    });

    it('should decode state with multiple sources', () => {
      const state: PaginationState = {
        'cluster1-namespace1': {
          k8sToken: 'k8s-token-123',
        },
        'cluster2-namespace2': {
          kubearchiveToken: 'kubearchive-token-456',
        },
        'cluster3-namespace3': {
          k8sToken: 'k8s-token-789',
          kubearchiveToken: 'kubearchive-token-abc',
        },
      };
      const userId = 'user@example.com';
      const token = encodeContinuationToken(state, userId);

      const decoded = decodeContinuationToken(token, userId);

      expect(decoded).toEqual(state);
    });

    it('should throw error when userId does not match', () => {
      const state: PaginationState = {
        'cluster1-namespace1': {
          k8sToken: 'k8s-token-123',
        },
      };
      const originalUserId = 'user1@example.com';
      const token = encodeContinuationToken(state, originalUserId);

      expect(() => {
        decodeContinuationToken(token, 'user2@example.com');
      }).toThrow('Continuation token does not belong to the current user');
    });

    it('should throw error for invalid base64 string', () => {
      const invalidToken = 'not-valid-base64!!!';

      expect(() => {
        decodeContinuationToken(invalidToken, 'user@example.com');
      }).toThrow();
    });

    it('should throw error for base64 string that is not valid JSON', () => {
      // Valid base64 but not valid JSON
      const invalidJsonToken = Buffer.from('not json').toString('base64');

      expect(() => {
        decodeContinuationToken(invalidJsonToken, 'user@example.com');
      }).toThrow();
    });

    it('should throw error for JSON that does not match PaginationToken structure', () => {
      // Valid base64 and JSON, but wrong structure
      const invalidStructureToken = Buffer.from(
        JSON.stringify({ wrong: 'structure' }),
      ).toString('base64');

      expect(() => {
        decodeContinuationToken(invalidStructureToken, 'user@example.com');
      }).toThrow();
    });

    it('should throw error for empty string token', () => {
      expect(() => {
        decodeContinuationToken('', 'user@example.com');
      }).toThrow();
    });

    it('should preserve exact token values', () => {
      const state: PaginationState = {
        'cluster1-namespace1': {
          k8sToken: 'very-long-token-with-special-chars-123!@#$%^&*()',
          kubearchiveToken: 'another-token-with-dashes-and_underscores',
        },
      };
      const userId = 'user@example.com';
      const token = encodeContinuationToken(state, userId);

      const decoded = decodeContinuationToken(token, userId);

      expect(decoded['cluster1-namespace1'].k8sToken).toBe(
        'very-long-token-with-special-chars-123!@#$%^&*()',
      );
      expect(decoded['cluster1-namespace1'].kubearchiveToken).toBe(
        'another-token-with-dashes-and_underscores',
      );
    });

    it('should round-trip encode and decode correctly', () => {
      const originalState: PaginationState = {
        'cluster1-namespace1': {
          k8sToken: 'k8s-token-123',
          kubearchiveToken: 'kubearchive-token-456',
        },
        'cluster2-namespace2': {
          k8sToken: 'k8s-token-789',
        },
      };
      const userId = 'user@example.com';

      const token = encodeContinuationToken(originalState, userId);
      const decoded = decodeContinuationToken(token, userId);

      expect(decoded).toEqual(originalState);
    });
  });

  describe('encodeContinuationToken and decodeContinuationToken integration', () => {
    it('should maintain data integrity through encode/decode cycle', () => {
      const testCases: Array<{
        state: PaginationState;
        userId: string;
      }> = [
        {
          state: {
            'cluster1-namespace1': {
              k8sToken: 'token1',
            },
          },
          userId: 'user1@example.com',
        },
        {
          state: {
            'cluster1-namespace1': {
              kubearchiveToken: 'token2',
            },
            'cluster2-namespace2': {
              k8sToken: 'token3',
              kubearchiveToken: 'token4',
            },
          },
          userId: 'user2@example.com',
        },
        {
          state: {},
          userId: 'user3@example.com',
        },
      ];

      testCases.forEach(({ state, userId }) => {
        const token = encodeContinuationToken(state, userId);
        const decoded = decodeContinuationToken(token, userId);
        expect(decoded).toEqual(state);
      });
    });
  });
});
