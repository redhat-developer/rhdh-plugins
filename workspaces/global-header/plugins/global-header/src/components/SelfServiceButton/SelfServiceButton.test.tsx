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

import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';

import { SelfServiceButton } from './SelfServiceButton';
import { useIsScaffolderAvailable } from '../../hooks/useIsScaffolderAvailable';

jest.mock('../../hooks/useIsScaffolderAvailable', () => ({
  useIsScaffolderAvailable: jest.fn(),
}));

const mockUseIsScaffolderAvailable = jest.mocked(useIsScaffolderAvailable);

describe('SelfServiceButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render a button when scaffolder is not available', async () => {
    mockUseIsScaffolderAvailable.mockReturnValue(false);
    const { queryByRole } = await renderInTestApp(
      <TestApiProvider apis={[]}>
        <SelfServiceButton />
      </TestApiProvider>,
    );
    expect(queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a button when scaffolder is available', async () => {
    mockUseIsScaffolderAvailable.mockReturnValue(true);
    const { getByRole } = await renderInTestApp(
      <TestApiProvider apis={[]}>
        <SelfServiceButton />
      </TestApiProvider>,
    );
    const link = getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('aria-label')).toEqual('Self-service');
    expect(link.getAttribute('href')).toEqual('/create');
  });

  it('supports custom props when available', async () => {
    mockUseIsScaffolderAvailable.mockReturnValue(true);
    const { getByRole } = await renderInTestApp(
      <TestApiProvider apis={[]}>
        <SelfServiceButton
          title="Custom Create"
          to="/custom-create"
          icon="add"
        />
      </TestApiProvider>,
    );
    const link = getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('aria-label')).toEqual('Custom Create');
    expect(link.getAttribute('href')).toEqual('/custom-create');
  });
});
