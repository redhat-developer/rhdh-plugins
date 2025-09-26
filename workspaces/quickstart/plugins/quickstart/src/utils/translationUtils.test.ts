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

import { getTranslatedTextWithFallback } from './translationUtils';

describe('getTranslatedTextWithFallback', () => {
  // Mock translation function
  const mockTranslationFunction = jest.fn();

  beforeEach(() => {
    mockTranslationFunction.mockClear();
  });

  describe('when translationKey is undefined', () => {
    it('should return fallback text without calling translation function', () => {
      const result = getTranslatedTextWithFallback(
        mockTranslationFunction,
        undefined,
        'fallback text',
      );

      expect(result).toBe('fallback text');
      expect(mockTranslationFunction).not.toHaveBeenCalled();
    });
  });

  describe('when translationKey is provided', () => {
    it('should return translated text when translation is found', () => {
      mockTranslationFunction.mockReturnValue('Translated Text');

      const result = getTranslatedTextWithFallback(
        mockTranslationFunction,
        'test.key',
        'fallback text',
      );

      expect(result).toBe('Translated Text');
      expect(mockTranslationFunction).toHaveBeenCalledWith('test.key', {});
    });

    it('should return fallback text when translation is not found (returns the key)', () => {
      mockTranslationFunction.mockReturnValue('test.key');

      const result = getTranslatedTextWithFallback(
        mockTranslationFunction,
        'test.key',
        'fallback text',
      );

      expect(result).toBe('fallback text');
      expect(mockTranslationFunction).toHaveBeenCalledWith('test.key', {});
    });
  });
});
