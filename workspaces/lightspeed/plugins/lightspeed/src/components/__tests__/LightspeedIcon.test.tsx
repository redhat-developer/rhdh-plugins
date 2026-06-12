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
import {
  LightspeedFABIcon,
  LightspeedFABOpenIcon,
  LightspeedIcon,
} from '../LightspeedIcon';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

describe('LightspeedIcon', () => {
  it('should render the intelligent assistant icon with correct aria-label', () => {
    render(<LightspeedIcon />);

    const svg = screen.getByLabelText('intelligent assistant icon');
    expect(svg).toBeInTheDocument();
  });
});

describe('LightspeedFABIcon', () => {
  it('should render the FAB icon with correct test id', () => {
    render(<LightspeedFABIcon />);

    const svg = screen.getByTestId('lightspeed-fab-icon');
    expect(svg).toBeInTheDocument();
  });
});

describe('LightspeedFABOpenIcon', () => {
  it('should render the chevron-down icon with correct test id', () => {
    render(<LightspeedFABOpenIcon />);

    const svg = screen.getByTestId('lightspeed-fab-open-icon');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-label', 'Close');
  });
});
