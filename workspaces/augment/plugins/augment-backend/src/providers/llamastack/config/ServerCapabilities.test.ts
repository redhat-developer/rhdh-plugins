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

import { createMockLogger } from '../../../test-utils/mocks';
import {
  parseVersion,
  resolveCapabilities,
  isToolCompatibilityError,
} from './ServerCapabilities';
import type { ServerCapabilityOverrides } from './ServerCapabilities';

describe('ServerCapabilities', () => {
  const logger = createMockLogger();

  describe('parseVersion', () => {
    it('parses a standard semver string', () => {
      expect(parseVersion('0.3.3')).toEqual([0, 3, 3]);
    });

    it('parses a two-part version', () => {
      expect(parseVersion('1.2')).toEqual([1, 2, 0]);
    });

    it('returns null for undefined', () => {
      expect(parseVersion(undefined)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseVersion('')).toBeNull();
    });

    it('returns null for non-numeric', () => {
      expect(parseVersion('abc.def')).toBeNull();
    });

    it('returns null for single number', () => {
      expect(parseVersion('1')).toBeNull();
    });

    it('strips pre-release suffixes', () => {
      expect(parseVersion('0.3.3-rc1')).toEqual([0, 3, 3]);
      expect(parseVersion('1.0.0-beta.2')).toEqual([1, 0, 0]);
      expect(parseVersion('0.6.0-dev+build123')).toEqual([0, 6, 0]);
    });
  });

  describe('resolveCapabilities', () => {
    it('assumes all capabilities for unknown version', () => {
      const caps = resolveCapabilities(undefined, undefined, logger);
      expect(caps.functionTools).toBe(true);
      expect(caps.strictField).toBe(true);
      expect(caps.maxOutputTokens).toBe(true);
      expect(caps.mcpTools).toBe(true);
      expect(caps.parallelToolCalls).toBe(true);
    });

    it('disables strictField and maxOutputTokens for Llama Stack 0.3.x', () => {
      const caps = resolveCapabilities('0.3.3', undefined, logger);
      expect(caps.functionTools).toBe(true);
      expect(caps.strictField).toBe(false);
      expect(caps.maxOutputTokens).toBe(false);
      expect(caps.mcpTools).toBe(true);
    });

    it('disables strictField and maxOutputTokens for Llama Stack 0.5.x', () => {
      const caps = resolveCapabilities('0.5.2', undefined, logger);
      expect(caps.strictField).toBe(false);
      expect(caps.maxOutputTokens).toBe(false);
    });

    it('enables all for Llama Stack 0.6.0+', () => {
      const caps = resolveCapabilities('0.6.0', undefined, logger);
      expect(caps.strictField).toBe(true);
      expect(caps.maxOutputTokens).toBe(true);
      expect(caps.functionTools).toBe(true);
    });

    it('enables all for Llama Stack 1.0.0+', () => {
      const caps = resolveCapabilities('1.0.0', undefined, logger);
      expect(caps.strictField).toBe(true);
      expect(caps.maxOutputTokens).toBe(true);
    });

    it('applies explicit overrides over version defaults', () => {
      const overrides: ServerCapabilityOverrides = {
        strictField: true,
      };
      const caps = resolveCapabilities('0.3.3', overrides, logger);
      expect(caps.strictField).toBe(true);
      expect(caps.maxOutputTokens).toBe(false);
    });

    it('override can disable a capability even for new versions', () => {
      const overrides: ServerCapabilityOverrides = {
        functionTools: false,
      };
      const caps = resolveCapabilities('0.6.0', overrides, logger);
      expect(caps.functionTools).toBe(false);
    });

    it('undefined override values fall through to version defaults', () => {
      const overrides: ServerCapabilityOverrides = {
        strictField: undefined,
      };
      const caps = resolveCapabilities('0.3.3', overrides, logger);
      expect(caps.strictField).toBe(false);
    });
  });

  describe('isToolCompatibilityError', () => {
    it('matches "unsupported tool type"', () => {
      expect(isToolCompatibilityError('unsupported tool type: function')).toBe(
        true,
      );
    });

    it('matches "unknown tool type"', () => {
      expect(isToolCompatibilityError('unknown tool type: function')).toBe(
        true,
      );
    });

    it('matches "function tool type"', () => {
      expect(
        isToolCompatibilityError('function tool type is not supported'),
      ).toBe(true);
    });

    it('matches Pydantic strict/tool validation', () => {
      expect(isToolCompatibilityError('extra input strict tool')).toBe(true);
    });

    it('matches "validation error tool"', () => {
      expect(
        isToolCompatibilityError('validation error for tool definition'),
      ).toBe(true);
    });

    it('does not match unrelated errors', () => {
      expect(isToolCompatibilityError('connection refused')).toBe(false);
    });

    it('does not match bare "tool" without type context', () => {
      expect(isToolCompatibilityError('tool execution timed out')).toBe(false);
    });

    it('does not match bare "strict" without tool context', () => {
      expect(isToolCompatibilityError('strict mode is enabled')).toBe(false);
    });
  });
});
