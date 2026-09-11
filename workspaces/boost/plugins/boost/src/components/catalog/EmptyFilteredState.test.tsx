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

import { renderInTestApp } from '@backstage/test-utils';
import { fireEvent, screen } from '@testing-library/react';

import { boostMessages } from '../../translations/ref';
import { EmptyFilteredState } from './EmptyFilteredState';

const { catalog: msg } = boostMessages;

describe('EmptyFilteredState', () => {
  it('renders copy and calls onClearFilters', async () => {
    const onClearFilters = jest.fn();
    await renderInTestApp(
      <EmptyFilteredState onClearFilters={onClearFilters} />,
    );

    expect(screen.getByText(msg.emptyFiltered.title)).toBeInTheDocument();
    expect(screen.getByText(msg.emptyFiltered.description)).toBeInTheDocument();

    fireEvent.click(screen.getByText(msg.emptyFiltered.clearFilters));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });
});
