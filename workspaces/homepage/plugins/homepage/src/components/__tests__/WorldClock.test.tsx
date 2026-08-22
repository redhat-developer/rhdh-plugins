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

import { render, screen } from '@testing-library/react';

import { WorldClock } from '../WorldClock';

jest.mock('@backstage/plugin-home', () => ({
  HeaderWorldClock: ({
    clockConfigs,
    customTimeFormat,
  }: {
    clockConfigs: { label: string }[];
    customTimeFormat?: Intl.DateTimeFormatOptions;
  }) => (
    <div data-testid="header-world-clock">
      {clockConfigs.map(c => c.label).join(',')}
      {customTimeFormat ? '-custom' : ''}
    </div>
  ),
}));

describe('WorldClock', () => {
  const worldClocks = [{ label: 'NYC', timeZone: 'America/New_York' }];

  it('renders world clocks with default justifyContent', () => {
    const { container } = render(<WorldClock worldClocks={worldClocks} />);

    expect(screen.getByTestId('header-world-clock')).toHaveTextContent('NYC');
    expect(container.firstChild).toHaveStyle({
      justifyContent: 'space-between',
    });
  });

  it('renders with custom justifyContent and timeFormat', () => {
    const timeFormat = { hour: 'numeric' as const, minute: 'numeric' as const };
    const { container } = render(
      <WorldClock
        worldClocks={worldClocks}
        justifyContent="space-around"
        timeFormat={timeFormat}
      />,
    );

    expect(screen.getByTestId('header-world-clock')).toHaveTextContent(
      'NYC-custom',
    );
    expect(container.firstChild).toHaveStyle({
      justifyContent: 'space-around',
    });
  });
});
