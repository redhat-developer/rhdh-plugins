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
import { LightspeedFABIcon, LightspeedIcon } from '../LightspeedIcon';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

describe('LightspeedIcon', () => {
  it('should render the lightspeed icon with correct alt text', () => {
    render(<LightspeedIcon />);

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'lightspeed icon');
    expect(img).toHaveStyle({ height: '25px' });
  });
});

describe('LightspeedFABIcon', () => {
  it('should render the FAB icon with correct alt text', () => {
    render(<LightspeedFABIcon />);

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('data-testid', 'lightspeed-fab-icon');
    expect(img).toHaveStyle({
      width: '100%',
      height: '100%',
      display: 'block',
    });
  });
});
