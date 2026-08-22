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
import { FeaturedDocsCard } from '../FeaturedDocsCard';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

jest.mock('@backstage/plugin-home', () => ({
  FeaturedDocsCard: ({
    title,
    subLinkText,
  }: {
    title: string;
    subLinkText: string;
  }) => (
    <div data-testid="featured-docs-card">
      <span data-testid="title">{title}</span>
      <span data-testid="sub-link">{subLinkText}</span>
    </div>
  ),
}));

describe('FeaturedDocsCard', () => {
  it('renders with translated title and sub link text', () => {
    render(<FeaturedDocsCard filter={{ kind: 'component' }} />);

    expect(screen.getByTestId('title')).toHaveTextContent('Featured Docs');
    expect(screen.getByTestId('sub-link').textContent).toContain('Learn more');
  });
});
