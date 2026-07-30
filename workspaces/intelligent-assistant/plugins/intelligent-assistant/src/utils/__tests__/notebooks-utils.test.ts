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

import { formatUpdatedLabel } from '../notebooks-utils';

const mockT = (key: string, _params?: any) => {
  const translations: Record<string, string> = {
    'notebooks.updated.today': 'Updated today',
    'notebooks.updated.yesterday': 'Updated yesterday',
    'notebooks.updated.days': `Updated ${_params?.days} days ago`,
    'notebooks.updated.on': 'Updated on',
  };
  return translations[key] ?? key;
};

describe('formatUpdatedLabel', () => {
  it('should return "Updated today" for a date from today', () => {
    const now = new Date().toISOString();
    expect(formatUpdatedLabel(now, mockT as any)).toBe('Updated today');
  });

  it('should return "Updated yesterday" for a date from yesterday', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatUpdatedLabel(yesterday, mockT as any)).toBe(
      'Updated yesterday',
    );
  });

  it('should return "Updated N days ago" for dates within the last week', () => {
    const threeDaysAgo = new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(formatUpdatedLabel(threeDaysAgo, mockT as any)).toBe(
      'Updated 3 days ago',
    );
  });

  it('should return a formatted date for dates older than a week', () => {
    const twoWeeksAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const result = formatUpdatedLabel(twoWeeksAgo, mockT as any);
    expect(result).toMatch(/^Updated on /);
  });

  it('should return the raw string for invalid dates', () => {
    expect(formatUpdatedLabel('not-a-date', mockT as any)).toBe('not-a-date');
  });
});
