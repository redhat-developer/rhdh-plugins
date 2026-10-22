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

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { Trans } from '../Trans';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

describe('Trans', () => {
  it('renders translated message', () => {
    render(<Trans message="header.welcome" />);

    expect(screen.getByText('Welcome back!')).toBeInTheDocument();
  });

  it('passes interpolation params to translation', () => {
    render(
      <Trans message="header.welcomePersonalized" params={{ name: 'Jane' }} />,
    );

    expect(screen.getByText('Welcome back, Jane!')).toBeInTheDocument();
  });
});
