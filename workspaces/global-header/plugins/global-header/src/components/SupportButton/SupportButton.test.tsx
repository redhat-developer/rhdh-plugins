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

import { configApiRef } from '@backstage/core-plugin-api';
import {
  renderInTestApp,
  mockApis,
  TestApiProvider,
} from '@backstage/test-utils';

import {
  MockTrans,
  mockUseTranslation,
} from '../../test-utils/mockTranslations';
import { SupportButton } from './SupportButton';

// Mock translation hooks
jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../components/Trans', () => ({
  Trans: MockTrans,
}));

const configWithSupportUrl = mockApis.config({
  data: {
    app: {
      support: {
        url: 'https://access.redhat.com/products/red-hat-developer-hub',
      },
    },
  },
});

const configWithoutSupportUrl = mockApis.config({
  data: {
    app: {},
  },
});

describe('SupportButton', () => {
  it('renders a button when the support url is defined', async () => {
    const { getByTestId } = await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, configWithSupportUrl]]}>
        <SupportButton />
      </TestApiProvider>,
    );
    expect(getByTestId('support-button')).toBeInTheDocument();
    expect(getByTestId('support-button').getAttribute('href')).toEqual(
      'https://access.redhat.com/products/red-hat-developer-hub',
    );
    expect(getByTestId('support-button').getAttribute('target')).toEqual(
      '_blank',
    );
  });

  it('renders no button when the support url is not defined', async () => {
    const { queryAllByRole } = await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, configWithoutSupportUrl]]}>
        <SupportButton />
      </TestApiProvider>,
    );
    expect(queryAllByRole('link')).toHaveLength(0);
  });

  it('uses the to prop also when the support url is defined', async () => {
    const { getByTestId } = await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, configWithSupportUrl]]}>
        <SupportButton to="https://access.redhat.com/documentation/en-us/red_hat_developer_hub" />
      </TestApiProvider>,
    );
    expect(getByTestId('support-button').getAttribute('href')).toEqual(
      'https://access.redhat.com/documentation/en-us/red_hat_developer_hub',
    );
    expect(getByTestId('support-button').getAttribute('target')).toEqual(
      '_blank',
    );
  });

  it('uses the to prop also when the support url is not defined', async () => {
    const { getByTestId } = await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, configWithoutSupportUrl]]}>
        <SupportButton to="https://access.redhat.com/documentation/en-us/red_hat_developer_hub" />
      </TestApiProvider>,
    );
    expect(getByTestId('support-button').getAttribute('href')).toEqual(
      'https://access.redhat.com/documentation/en-us/red_hat_developer_hub',
    );
    expect(getByTestId('support-button').getAttribute('target')).toEqual(
      '_blank',
    );
  });
});
