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
  getDismissedEntityIllustrationUsers,
  addDismissedEntityIllustrationUsers,
  hasEntityIllustrationUserDismissed,
} from './utils';

describe('Entity Illustration Dismissal Utils', () => {
  const key = 'homepage/dismissedEntityIllustrationUsers';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('getDismissedEntityIllustrationUsers', () => {
    it('should return an empty array if localStorage is empty', () => {
      expect(getDismissedEntityIllustrationUsers()).toEqual([]);
    });

    it('should return parsed array if data is present in localStorage', () => {
      localStorage.setItem(key, JSON.stringify(['eswar']));
      expect(getDismissedEntityIllustrationUsers()).toEqual(['eswar']);
    });
  });

  describe('addDismissedEntityIllustrationUsers', () => {
    it('should add a new username to localStorage', () => {
      addDismissedEntityIllustrationUsers('eswar');
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      expect(stored).toContain('eswar');
    });

    it('should not add duplicate usernames', () => {
      localStorage.setItem(key, JSON.stringify(['eswar']));
      addDismissedEntityIllustrationUsers('eswar');
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      expect(stored).toEqual(['eswar']);
    });
  });

  describe('hasEntityIllustrationUserDismissed', () => {
    it('should return true if username is in localStorage', () => {
      localStorage.setItem(key, JSON.stringify(['eswar']));
      expect(hasEntityIllustrationUserDismissed('eswar')).toBe(true);
    });

    it('should return false if username is not in localStorage', () => {
      localStorage.setItem(key, JSON.stringify(['karthik']));
      expect(hasEntityIllustrationUserDismissed('eswar')).toBe(false);
    });
  });
});
