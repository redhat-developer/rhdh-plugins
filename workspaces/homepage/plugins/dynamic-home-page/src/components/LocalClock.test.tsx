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

import React from 'react';
import { render, screen } from '@testing-library/react';

import { LocalClock } from './LocalClock';

jest.mock('@backstage/core-components', () => ({
  ...jest.requireActual('@backstage/core-components'),
  HeaderLabel: ({ label, value }: { label: string; value?: string }) => (
    <div data-testid="header-label">
      <div data-testid="label">{label}</div>
      <div data-testid="value">{value}</div>
    </div>
  ),
}));

describe('LocalClock', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01 13:14:15'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('renders successfully', () => {
    render(<LocalClock />);
    expect(screen.getByText('01:14 PM')).toBeInTheDocument();
  });

  it.skip('renders nothing if format is none', () => {
    render(<LocalClock format="none" />);
    expect(screen.getByTestId).toBeInTheDocument();
  });

  const formats = {
    full: 'Wednesday, 01/01/2025, 01:14 PM',
    date: '01/01/2025',
    datewithweekday: 'Wednesday, 01/01/2025',
    time: '01:14 PM',
    timewithseconds: '01:14:15 PM',
    both: '01/01/2025, 01:14 PM',
  };

  for (const [format, expectedDateTime] of Object.entries(formats)) {
    it(`renders format ${format} correctly`, () => {
      render(<LocalClock format={format as any} />);
      expect(screen.getByText(expectedDateTime)).toBeInTheDocument();
    });
  }
});
