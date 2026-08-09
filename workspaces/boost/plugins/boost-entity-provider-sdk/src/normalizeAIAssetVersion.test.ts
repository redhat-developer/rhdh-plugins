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

import { normalizeAIAssetVersion } from './normalizeAIAssetVersion';

describe('normalizeAIAssetVersion', () => {
  describe('semver pass-through', () => {
    it('returns a valid semver version unchanged', () => {
      expect(normalizeAIAssetVersion('1.2.3')).toBe('1.2.3');
    });

    it('returns a semver with pre-release tag unchanged', () => {
      expect(normalizeAIAssetVersion('2.0.0-beta.1')).toBe('2.0.0-beta.1');
    });

    it('returns 0.0.0 unchanged', () => {
      expect(normalizeAIAssetVersion('0.0.0')).toBe('0.0.0');
    });

    it('returns semver with pre-release unchanged', () => {
      expect(normalizeAIAssetVersion('1.0.0-alpha')).toBe('1.0.0-alpha');
    });
  });

  describe('date-based normalization', () => {
    it('normalizes compact date format YYYYMMDD', () => {
      expect(normalizeAIAssetVersion('20260708')).toBe('0.0.0-20260708');
    });

    it('normalizes dash-separated date to compact format', () => {
      expect(normalizeAIAssetVersion('2026-07-08')).toBe('0.0.0-20260708');
    });
  });

  describe('commit hash normalization', () => {
    it('normalizes a 7-character commit hash', () => {
      expect(normalizeAIAssetVersion('a1b2c3d')).toBe('0.0.0-a1b2c3d');
    });

    it('normalizes a 12-character commit hash', () => {
      expect(normalizeAIAssetVersion('a1b2c3d4e5f6')).toBe(
        '0.0.0-a1b2c3d4e5f6',
      );
    });
  });

  describe('fallback', () => {
    it('normalizes unrecognized format to 0.0.0-unknown', () => {
      const warn = jest.fn();
      expect(normalizeAIAssetVersion('unknown-format-xyz', { warn })).toBe(
        '0.0.0-unknown',
      );
    });

    it('logs a warning for unrecognized format', () => {
      const warn = jest.fn();
      normalizeAIAssetVersion('unknown-format-xyz', { warn });
      expect(warn).toHaveBeenCalledWith(
        "Unrecognized version format 'unknown-format-xyz'. Normalized to 0.0.0-unknown",
      );
    });

    it('includes entityRef in the warning when provided', () => {
      const warn = jest.fn();
      normalizeAIAssetVersion('bad-version', {
        entityRef: 'resource:default/my-agent',
        warn,
      });
      expect(warn).toHaveBeenCalledWith(
        "Unrecognized version format 'bad-version' for entity resource:default/my-agent. Normalized to 0.0.0-unknown",
      );
    });
  });

  describe('edge cases', () => {
    it('trims whitespace from input', () => {
      expect(normalizeAIAssetVersion('  1.2.3  ')).toBe('1.2.3');
    });
  });
});
