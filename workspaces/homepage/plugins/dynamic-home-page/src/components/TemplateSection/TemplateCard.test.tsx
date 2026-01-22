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
import { MemoryRouter } from 'react-router-dom';

import TemplateCard from './TemplateCard';

describe('TemplateCard', () => {
  const props = {
    link: '/template/example',
    title: 'Sample Template',
    description:
      'This is a description of the sample template used for testing.',
    type: 'website',
  };

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <TemplateCard {...props} />
      </MemoryRouter>,
    );

  it('should render without crashing', () => {
    renderComponent();
    const link = screen.getByRole('link', { name: /sample template/i });
    expect(link).toBeInTheDocument();
  });

  it('should render the title as a link', () => {
    renderComponent();
    const linkElement = screen.getByRole('link', { name: /sample template/i });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', props.link);
  });

  it('should render the description text', () => {
    renderComponent();
    expect(screen.getByText(/this is a description/i)).toBeInTheDocument();
  });

  it('should display the correct type in the Chip', () => {
    renderComponent();
    expect(screen.getByText(props.type)).toBeInTheDocument();
  });
});
