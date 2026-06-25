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
  mapLifecycleStage,
  mapOwner,
  sanitizeEntityName,
} from './entityHelpers';

describe('entityHelpers', () => {
  describe('mapLifecycleStage', () => {
    it('should map draft to experimental', () => {
      expect(mapLifecycleStage('draft')).toBe('experimental');
    });

    it('should map pending to experimental', () => {
      expect(mapLifecycleStage('pending')).toBe('experimental');
    });

    it('should map published to production', () => {
      expect(mapLifecycleStage('published')).toBe('production');
    });

    it('should map archived to deprecated', () => {
      expect(mapLifecycleStage('archived')).toBe('deprecated');
    });

    it('should default to experimental for undefined', () => {
      expect(mapLifecycleStage(undefined)).toBe('experimental');
    });
  });

  describe('sanitizeEntityName', () => {
    it('should lowercase and replace invalid chars', () => {
      expect(sanitizeEntityName('My Agent!')).toBe('my-agent');
    });

    it('should collapse multiple hyphens', () => {
      expect(sanitizeEntityName('a--b---c')).toBe('a-b-c');
    });

    it('should strip leading/trailing hyphens', () => {
      expect(sanitizeEntityName('-test-')).toBe('test');
    });

    it('should truncate to 63 characters', () => {
      const long = 'a'.repeat(100);
      expect(sanitizeEntityName(long).length).toBeLessThanOrEqual(63);
    });
  });

  describe('mapOwner', () => {
    it('should return unknown for undefined', () => {
      expect(mapOwner(undefined)).toBe('unknown');
    });

    it('should pass through entity refs', () => {
      expect(mapOwner('user:default/admin')).toBe('user:default/admin');
    });

    it('should wrap plain usernames', () => {
      expect(mapOwner('admin')).toBe('user:default/admin');
    });
  });
});
